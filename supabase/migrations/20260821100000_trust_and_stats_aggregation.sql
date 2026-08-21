-- =============================================================================
-- GÜVEN PUANI VE İSTATİSTİK TOPLAMA
-- =============================================================================
-- Denetim bulguları C-03 ve C-06:
--
--   · Takas tamamlandığında trust_profiles.completed_trades hiç artmıyordu.
--   · Değerlendirme yazıldığında trust_score yeniden hesaplanmıyor,
--     trust_events'e hiçbir satır yazılmıyordu.
--   · mapProfile() içinde averageRating sabit 5, reviewCount sabit 0 idi.
--   · impact_records'a veri YAZILIYOR ama hiçbir yerde OKUNMUYORDU; profil ve
--     "Etkim" ekranları her kullanıcıya sıfır çevresel etki gösteriyordu.
--
-- Yani ürünün merkezindeki iki gösterge — güven ve çevresel etki — kullanıcı
-- ne yaparsa yapsın sabit kalıyordu. Bu migration ikisini de gerçek veriye
-- bağlar.
--
-- Toplama işi kasıtlı olarak veritabanında yapılıyor: istemcide hesaplanan bir
-- güven puanı, istemciden değiştirilebilir bir güven puanı demektir.
-- trust_profiles üzerinde hiçbir yazma politikası yok (bkz. 20260821090000),
-- bu yüzden tüm güncellemeler buradaki `security definer` trigger'lardan
-- geçmek zorunda.
-- =============================================================================


-- ── Yeni kolonlar ───────────────────────────────────────────────────────────

alter table public.trust_profiles
  add column if not exists average_rating numeric,
  add column if not exists review_count integer not null default 0;

-- Kolon varsayılanı 5 idi: yani HER yeni kullanıcı, hiç takas yapmadan
-- 5.00 puanla ve trustLevelFromScore()'a göre "Topluluk Lideri" olarak
-- başlıyordu. Nötr başlangıç 3.0 olarak düzeltiliyor.
alter table public.trust_profiles
  alter column trust_score set default 3.0;

comment on column public.trust_profiles.average_rating is
  'reviews tablosundan hesaplanan ortalama puan. Hiç değerlendirme yoksa NULL — '
  'sıfır ya da 5 DEĞİL: "veri yok" ile "kötü puan" farklı şeylerdir.';


-- ── Güven puanı formülü ─────────────────────────────────────────────────────
-- Tek yerde tanımlı olsun diye ayrı bir fonksiyon. Bileşenler:
--
--   · Temel  : ortalama puan. Hiç değerlendirme yoksa 3.0 (nötr başlangıç).
--   · Ceza   : yumuşatılmış iptal oranı × 1.5 puan.
--   · Bonus  : tamamlanan takas başına 0.02, en fazla +0.3.
--
-- İptal oranının paydasında +4'lük bir "önsel" var. Bu olmadan tek bir iptal
-- yaşamış yeni bir kullanıcı 1/1 = %100 iptal oranıyla cezalandırılıp puanı
-- yarıya düşüyordu. +4 ile aynı durum 1/5 = %20'ye karşılık geliyor; oran,
-- takas sayısı arttıkça gerçek değerine yaklaşıyor.
--
-- Sonuç [1.0, 5.0] aralığına kırpılır. Formül bilerek basit ve okunabilir
-- tutuldu; asıl kazanım puanın artık SABİT OLMAMASI ve istemciden
-- değiştirilememesi.
create or replace function public.calc_trust_score(
  p_avg_rating numeric,
  p_completed integer,
  p_cancelled integer
)
returns numeric
language sql
immutable
as $$
  select greatest(1.0, least(5.0,
    coalesce(p_avg_rating, 3.0)
    - (p_cancelled::numeric / (p_completed + p_cancelled + 4)) * 1.5
    + least(p_completed * 0.02, 0.3)
  ))::numeric(3,2);
$$;


-- ── Bir kullanıcının güven satırını baştan hesaplar ─────────────────────────
-- Artımlı (+1/-1) güncelleme yerine tam yeniden hesaplama tercih edildi:
-- yarış durumlarına ve kaçırılmış olaylara karşı dayanıklı, ve veri bozulursa
-- tek çağrıyla düzeltilebilir.
create or replace function public.recalc_trust_profile(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_avg numeric;
  v_reviews integer;
  v_completed integer;
  v_cancelled integer;
begin
  select round(avg(rating)::numeric, 2), count(*)
  into v_avg, v_reviews
  from public.reviews
  where reviewed_user_id = p_user_id;

  select
    count(*) filter (where status = 'completed'),
    count(*) filter (where status = 'cancelled')
  into v_completed, v_cancelled
  from public.trades
  where sender_id = p_user_id or receiver_id = p_user_id;

  insert into public.trust_profiles (user_id) values (p_user_id)
  on conflict (user_id) do nothing;

  update public.trust_profiles
  set average_rating   = v_avg,
      review_count     = coalesce(v_reviews, 0),
      completed_trades = coalesce(v_completed, 0),
      cancelled_trades = coalesce(v_cancelled, 0),
      trust_score      = public.calc_trust_score(v_avg, coalesce(v_completed,0), coalesce(v_cancelled,0)),
      updated_at       = now()
  where user_id = p_user_id;
end;
$$;


-- ── Trigger: değerlendirme yazılınca / silinince ────────────────────────────
create or replace function public.on_review_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target uuid := coalesce(new.reviewed_user_id, old.reviewed_user_id);
begin
  perform public.recalc_trust_profile(v_target);

  if tg_op = 'INSERT' then
    insert into public.trust_events (user_id, event_type, note, review_id, trade_id, score_change)
    values (
      v_target,
      'review_received',
      format('%s yıldızlı değerlendirme alındı.', new.rating),
      new.id,
      new.trade_id,
      null
    );
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_on_review_change on public.reviews;
create trigger trg_on_review_change
  after insert or update or delete on public.reviews
  for each row execute function public.on_review_change();


-- ── Trigger: takas tamamlanınca / iptal edilince ────────────────────────────
create or replace function public.on_trade_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status
     and new.status in ('completed', 'cancelled') then

    perform public.recalc_trust_profile(new.sender_id);
    perform public.recalc_trust_profile(new.receiver_id);

    insert into public.trust_events (user_id, event_type, note, trade_id)
    select uid,
           case when new.status = 'completed' then 'trade_completed' else 'trade_cancelled' end,
           case when new.status = 'completed'
                then 'Takas başarıyla tamamlandı.'
                else 'Takas iptal edildi.' end,
           new.id
    from unnest(array[new.sender_id, new.receiver_id]) as uid;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_on_trade_status_change on public.trades;
create trigger trg_on_trade_status_change
  after update on public.trades
  for each row execute function public.on_trade_status_change();


-- ── Kullanıcı istatistikleri ────────────────────────────────────────────────
-- impact_records üzerindeki RLS yalnızca takasın taraflarına okuma izni verir,
-- ama toplam çevresel etki herkese açık bir profil göstergesidir. Bu yüzden
-- toplama `security definer` bir fonksiyonda yapılıyor: tek tek takas kayıtları
-- gizli kalırken yalnızca TOPLAM dışarı veriliyor.
create or replace function public.get_user_stats(p_user_id uuid)
returns table (
  active_listings integer,
  completed_trades integer,
  completed_loops integer,
  co2e_kg numeric,
  water_liters numeric,
  energy_kwh numeric,
  material_kg numeric,
  waste_kg numeric,
  items_reused integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*)::integer from public.listings
      where owner_id = p_user_id and status = 'active'),

    (select count(*)::integer from public.trades
      where status = 'completed' and (sender_id = p_user_id or receiver_id = p_user_id)),

    (select count(*)::integer from public.loop_participants lp
      join public.loops l on l.id = lp.loop_id
      where lp.user_id = p_user_id and l.status = 'completed'),

    coalesce(agg.co2e, 0),
    coalesce(agg.water, 0),
    coalesce(agg.energy, 0),
    coalesce(agg.material, 0),
    coalesce(agg.waste, 0),
    coalesce(agg.reuse, 0)::integer
  from (
    select
      sum(ir.co2e_kg) as co2e,
      sum(ir.water_liters) as water,
      sum(ir.energy_kwh) as energy,
      sum(ir.material_kg) as material,
      sum(ir.waste_kg) as waste,
      sum(ir.reuse_count) as reuse
    from public.impact_records ir
    join public.trades t on t.id = ir.trade_id
    where t.status = 'completed'
      and (t.sender_id = p_user_id or t.receiver_id = p_user_id)
  ) agg;
$$;

grant execute on function public.get_user_stats(uuid) to anon, authenticated;


-- ── Mevcut veriyi bir kez geriye dönük hesapla ──────────────────────────────
-- Migration'dan önce yazılmış değerlendirme ve takaslar için sayaçlar hiç
-- işlenmemişti; hepsi burada tek seferde doğru değere çekiliyor.
do $$
declare
  r record;
begin
  for r in select user_id from public.trust_profiles loop
    perform public.recalc_trust_profile(r.user_id);
  end loop;
end
$$;


-- ── Yeni profil oluşturulurken güven satırını doğru kur ────────────────────
-- create_trust_profile() (20260818130000) yalnızca boş bir satır açıyordu ve
-- kolon varsayılanları geçerli oluyordu. Artık satır açıldıktan sonra formül
-- bir kez çalıştırılıyor; böylece varsayılan değerlerle formülün sonucu
-- birbirinden ayrışamaz.
create or replace function public.create_trust_profile()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  insert into public.trust_profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  perform public.recalc_trust_profile(new.id);

  return new;
end;
$$;

drop trigger if exists trg_create_trust_profile on public.profiles;
create trigger trg_create_trust_profile
  after insert on public.profiles
  for each row execute function public.create_trust_profile();

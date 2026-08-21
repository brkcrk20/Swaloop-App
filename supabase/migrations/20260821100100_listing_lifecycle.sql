-- =============================================================================
-- İLAN YAŞAM DÖNGÜSÜ + TAKAS İPTALİ
-- =============================================================================
-- Denetim bulgusu C-02: zaman çizelgesinde "Ürünler diğer kullanıcılara
-- kilitlendi" yazıyordu ama listings.status hiçbir adımda değişmiyordu. Takas
-- edilmiş bir ürün keşif akışında hâlâ 'active' görünüyor ve aynı anda birden
-- fazla takasa konu olabiliyordu.
--
-- Bu bir önceki turda BİLEREK ertelenmişti: kilitleme eklenip serbest bırakma
-- yolu eklenmezse, yarım kalan bir takasın ürünleri sonsuza kadar kilitli
-- kalırdı. Bu migration ikisini birlikte getiriyor.
--
-- DURUM AKIŞI
--   active   ─ teklif kabul edilir ─→ locked
--   locked   ─ takas tamamlanır ───→ traded   (son durum)
--   locked   ─ takas iptal edilir ─→ active   (yeniden takasa açık)
--   active   ─ moderasyon ─────────→ removed
--
-- Ek olarak: bir ilan kilitlendiğinde, o ilanı içeren DİĞER bekleyen teklifler
-- otomatik reddedilir. Aksi halde kullanıcı, artık elde olmayan bir ürün için
-- bekleyen bir teklif görmeye devam ederdi.
-- =============================================================================


-- Bir teklifin kalemlerindeki ilanları verilen duruma taşır.
create or replace function public.set_offer_listings_status(
  p_offer_id uuid,
  p_status text
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.listings
  set status = p_status, updated_at = now()
  where id in (
    select listing_id from public.trade_offer_items where offer_id = p_offer_id
  );
$$;


-- ── accept_trade_offer: kilitleme + rakip tekliflerin kapatılması ───────────
create or replace function public.accept_trade_offer(p_offer_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_offer public.trade_offers%rowtype;
  v_trade_id uuid;
  v_listing_ids uuid[];
begin
  if v_uid is null then
    raise exception 'Giriş yapmalısınız.';
  end if;

  select * into v_offer
  from public.trade_offers
  where id = p_offer_id
  for update;

  if not found then
    raise exception 'Teklif bulunamadı.';
  end if;

  if v_offer.receiver_id <> v_uid then
    raise exception 'Bu teklifi yalnızca alıcısı kabul edebilir.';
  end if;

  if v_offer.status not in ('offer_sent', 'counter_offered') then
    raise exception 'Bu teklif artık kabul edilebilir durumda değil (%).', v_offer.status;
  end if;

  if exists (select 1 from public.trades where offer_id = p_offer_id) then
    raise exception 'Bu teklif için zaten bir takas kaydı var.';
  end if;

  select array_agg(listing_id) into v_listing_ids
  from public.trade_offer_items where offer_id = p_offer_id;

  -- Kalemlerden herhangi biri başka bir takasta kilitlendiyse kabul edilemez.
  if exists (
    select 1 from public.listings
    where id = any(v_listing_ids) and status <> 'active'
  ) then
    raise exception 'Bu teklifteki ürünlerden biri artık müsait değil.';
  end if;

  update public.trade_offers
  set status = 'accepted', updated_at = now()
  where id = p_offer_id;

  insert into public.trades (offer_id, sender_id, receiver_id, status, delivery_method)
  values (v_offer.id, v_offer.sender_id, v_offer.receiver_id, 'locked', v_offer.proposed_delivery_method)
  returning id into v_trade_id;

  perform public.set_offer_listings_status(p_offer_id, 'locked');

  -- Aynı ürünleri içeren diğer bekleyen teklifleri otomatik kapat.
  update public.trade_offers o
  set status = 'rejected',
      rejection_reason = 'Ürün başka bir takasta kilitlendi.',
      updated_at = now()
  where o.id <> p_offer_id
    and o.status in ('offer_sent', 'counter_offered')
    and exists (
      select 1 from public.trade_offer_items i
      where i.offer_id = o.id and i.listing_id = any(v_listing_ids)
    );

  insert into public.trade_events (trade_id, actor_id, event_type, note)
  values (v_trade_id, v_uid, 'offer_accepted', 'Teklif kabul edildi, ürünler kilitlendi.');

  return v_trade_id;
end;
$$;

grant execute on function public.accept_trade_offer(uuid) to authenticated;


-- ── advance_trade: 6. adımda ürünleri 'traded' yap ─────────────────────────
create or replace function public.advance_trade(
  p_offer_id uuid,
  p_target_step integer,
  p_impact jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_trade public.trades%rowtype;
  v_new_status text;
  v_event_type text;
  v_current_rank integer;
  v_target_rank integer;
begin
  if v_uid is null then
    raise exception 'Giriş yapmalısınız.';
  end if;

  select * into v_trade from public.trades where offer_id = p_offer_id for update;

  if not found then
    raise exception 'Bu teklife bağlı bir takas kaydı yok.';
  end if;

  if v_uid not in (v_trade.sender_id, v_trade.receiver_id) then
    raise exception 'Bu takas üzerinde yetkiniz yok.';
  end if;

  if v_trade.status = 'cancelled' then
    raise exception 'İptal edilmiş bir takas ilerletilemez.';
  end if;

  if p_target_step = 4 then
    v_new_status := 'delivery_planned'; v_event_type := 'delivery_planned'; v_target_rank := 2;
  elsif p_target_step = 5 then
    v_new_status := 'verified';         v_event_type := 'verified';         v_target_rank := 3;
  elsif p_target_step = 6 then
    v_new_status := 'completed';        v_event_type := 'completed';        v_target_rank := 4;
  else
    raise exception 'Geçersiz adım: %', p_target_step;
  end if;

  v_current_rank := case v_trade.status
    when 'locked' then 1
    when 'delivery_planned' then 2
    when 'verified' then 3
    when 'completed' then 4
    else 0
  end;

  if v_current_rank >= v_target_rank then
    raise exception 'Takas bu adımı zaten geçti (mevcut durum: %).', v_trade.status;
  end if;

  if v_target_rank > v_current_rank + 1 then
    raise exception 'Takas adımları atlanamaz (mevcut durum: %).', v_trade.status;
  end if;

  update public.trades
  set status = v_new_status,
      completed_at = case when p_target_step = 6 then now() else completed_at end
  where id = v_trade.id;

  insert into public.trade_events (trade_id, actor_id, event_type)
  values (v_trade.id, v_uid, v_event_type);

  if p_target_step = 6 then
    -- Ürünler artık takas edilmiş: keşif akışından çıkar, yeniden teklif
    -- edilemez.
    perform public.set_offer_listings_status(p_offer_id, 'traded');

    if p_impact is not null then
      insert into public.impact_records (
        trade_id, co2e_kg, water_liters, energy_kwh,
        material_kg, waste_kg, reuse_count, methodology_version
      )
      values (
        v_trade.id,
        coalesce((p_impact->>'co2eKg')::numeric, 0),
        coalesce((p_impact->>'waterLiters')::numeric, 0),
        coalesce((p_impact->>'energyKwh')::numeric, 0),
        coalesce((p_impact->>'rawMaterialKg')::numeric, 0),
        coalesce((p_impact->>'wasteReductionKg')::numeric, 0),
        coalesce((p_impact->>'reuseCount')::integer, 1),
        coalesce(p_impact->>'methodologyVersion', 'v1')
      )
      on conflict (trade_id) do nothing;
    end if;
  end if;
end;
$$;

grant execute on function public.advance_trade(uuid, integer, jsonb) to authenticated;


-- ── cancel_trade: kilitli ürünleri serbest bırakan çıkış yolu ──────────────
-- Bu fonksiyon olmadan kilitleme eklemek, yarım kalan her takasın ürünlerini
-- kalıcı olarak dolaşımdan çıkarırdı.
create or replace function public.cancel_trade(
  p_offer_id uuid,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_trade public.trades%rowtype;
begin
  if v_uid is null then
    raise exception 'Giriş yapmalısınız.';
  end if;

  select * into v_trade from public.trades where offer_id = p_offer_id for update;

  if not found then
    raise exception 'Bu teklife bağlı bir takas kaydı yok.';
  end if;

  if v_uid not in (v_trade.sender_id, v_trade.receiver_id) then
    raise exception 'Bu takas üzerinde yetkiniz yok.';
  end if;

  if v_trade.status = 'completed' then
    raise exception 'Tamamlanmış bir takas iptal edilemez.';
  end if;

  if v_trade.status = 'cancelled' then
    raise exception 'Bu takas zaten iptal edilmiş.';
  end if;

  update public.trades
  set status = 'cancelled'
  where id = v_trade.id;

  update public.trade_offers
  set status = 'cancelled',
      rejection_reason = coalesce(p_reason, 'Takas iptal edildi.'),
      updated_at = now()
  where id = p_offer_id;

  -- Ürünler yeniden dolaşıma açılır — ama yalnızca bu takas yüzünden
  -- kilitlenmiş olanlar ('traded' olanlara dokunulmaz).
  update public.listings
  set status = 'active', updated_at = now()
  where status = 'locked'
    and id in (select listing_id from public.trade_offer_items where offer_id = p_offer_id);

  insert into public.trade_events (trade_id, actor_id, event_type, note)
  values (v_trade.id, v_uid, 'cancelled', coalesce(p_reason, 'Takas iptal edildi.'));

  -- İptal, güven puanı hesabına iptal oranı olarak yansır
  -- (trg_on_trade_status_change trigger'ı üzerinden).
end;
$$;

grant execute on function public.cancel_trade(uuid, text) to authenticated;


-- ── Görüntülenme sayacı ────────────────────────────────────────────────────
-- Denetim bulgusu C-09: listings.view_count okunuyor ve ilan kartlarında
-- gösteriliyordu ama hiçbir yerde artırılmıyordu; her ilan sonsuza kadar 0
-- görüntülenme gösteriyordu.
--
-- İstemciden doğrudan UPDATE verilmiyor: o durumda sayaç istenildiği kadar
-- şişirilebilirdi. Kendi ilanına bakmak sayacı artırmaz.
create or replace function public.increment_listing_view(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.listings
  set view_count = view_count + 1
  where id = p_listing_id
    and (auth.uid() is null or auth.uid() <> owner_id);
end;
$$;

grant execute on function public.increment_listing_view(uuid) to anon, authenticated;


-- ── Profil ilgi alanları ───────────────────────────────────────────────────
-- Denetim bulgusu B-04: createProfile() interests ve wantedCategories
-- parametrelerini alıyor ama veritabanına yazmıyordu; mapProfile() ise her
-- okumada bu iki alanı boş diziye sıfırlıyordu. Kayıt sırasında seçilen ilgi
-- alanları ilk sayfa yenilemesinde kayboluyordu.
alter table public.profiles
  add column if not exists interests text[] not null default '{}',
  add column if not exists wanted_categories text[] not null default '{}';


-- ── create_trade_offer: kilitli/takas edilmiş ürün teklif edilemez ─────────
-- Kilitleme eklendiğine göre, teklif oluşturma da buna uymalı: aksi halde
-- kullanıcı zaten başka bir takasta olan bir ürün için teklif gönderip
-- kabul aşamasında hata almaya devam ederdi.
create or replace function public.create_trade_offer(
  p_receiver_id uuid,
  p_offered_listing_ids uuid[],
  p_requested_listing_ids uuid[],
  p_message text default null,
  p_delivery_method text default 'in_person',
  p_parent_offer_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender_id uuid := auth.uid();
  v_offer_id uuid;
  v_listing_id uuid;
begin
  if v_sender_id is null then
    raise exception 'Teklif göndermek için giriş yapmalısınız.';
  end if;

  if p_receiver_id = v_sender_id then
    raise exception 'Kendinize takas teklifi gönderemezsiniz.';
  end if;

  if coalesce(array_length(p_offered_listing_ids, 1), 0) = 0
     or coalesce(array_length(p_requested_listing_ids, 1), 0) = 0 then
    raise exception 'Teklif en az bir verilen ve bir istenen ürün içermelidir.';
  end if;

  foreach v_listing_id in array p_offered_listing_ids loop
    if not exists (
      select 1 from public.listings
      where id = v_listing_id and owner_id = v_sender_id
    ) then
      raise exception 'Size ait olmayan bir ürünü teklif edemezsiniz.';
    end if;
    if not exists (
      select 1 from public.listings where id = v_listing_id and status = 'active'
    ) then
      raise exception 'Takasta olan ya da yayından kaldırılmış bir ürün teklif edilemez.';
    end if;
  end loop;

  foreach v_listing_id in array p_requested_listing_ids loop
    if not exists (
      select 1 from public.listings
      where id = v_listing_id and owner_id = p_receiver_id
    ) then
      raise exception 'İstenen ürün, teklif gönderilen kullanıcıya ait değil.';
    end if;
    if not exists (
      select 1 from public.listings where id = v_listing_id and status = 'active'
    ) then
      raise exception 'İstenen ürün artık müsait değil.';
    end if;
  end loop;

  insert into public.trade_offers (
    sender_id, receiver_id, status, message,
    proposed_delivery_method, parent_offer_id
  )
  values (
    v_sender_id, p_receiver_id, 'offer_sent', p_message,
    p_delivery_method, p_parent_offer_id
  )
  returning id into v_offer_id;

  insert into public.trade_offer_items (offer_id, listing_id, owner_id, role)
  select v_offer_id, lid, v_sender_id, 'offered'
  from unnest(p_offered_listing_ids) as lid;

  insert into public.trade_offer_items (offer_id, listing_id, owner_id, role)
  select v_offer_id, lid, p_receiver_id, 'requested'
  from unnest(p_requested_listing_ids) as lid;

  return v_offer_id;
end;
$$;

grant execute on function public.create_trade_offer(uuid, uuid[], uuid[], text, text, uuid) to authenticated;

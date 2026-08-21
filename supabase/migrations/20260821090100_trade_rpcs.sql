-- =============================================================================
-- TAKAS İŞLEMLERİ — yetki kontrollü, transaction'lı RPC'ler
-- =============================================================================
-- Önceden bu işlemler istemciden doğrudan UPDATE/INSERT ile yapılıyordu ve
-- çağıranın teklifin gerçek tarafı olup olmadığı HİÇ kontrol edilmiyordu.
-- Teklif kimliğini bilen herkes başkasının takasını kabul edebiliyordu.
--
-- Ayrıca acceptOffer atomik değildi: önce trade_offers 'accepted' yapılıyor,
-- sonra trades satırı ekleniyordu. İkinci adım başarısız olursa teklif kalıcı
-- olarak "kabul edildi ama takası yok" durumunda kalıyor ve akış kilitleniyordu.
--
-- Buradaki fonksiyonların tamamı tek bir transaction içinde çalışır (Postgres
-- fonksiyonları varsayılan olarak öyledir) ve `security definer` oldukları için
-- RLS'i aşarlar — bu yüzden yetki kontrolünü kendileri yapmak ZORUNDADIR.
-- Her fonksiyonun ilk işi auth.uid() doğrulamasıdır.
-- =============================================================================


-- Red gerekçesi için ayrı kolon. Önceden rejectOffer(), gerekçeyi `message`
-- kolonuna yazıyordu — yani teklifi gönderenin yazdığı orijinal notun üzerine.
alter table public.trade_offers
  add column if not exists rejection_reason text;

-- Teklif aşamasında seçilen teslimat tercihi. Önceden hiçbir yere
-- kaydedilmiyordu: `trades` satırı ancak kabulden sonra oluştuğu için
-- gönderenin tercihi alıcıya hiç ulaşmıyordu.
alter table public.trade_offers
  add column if not exists proposed_delivery_method text;


-- ── Teklif oluşturma ────────────────────────────────────────────────────────
-- Teklif satırı ve kalemleri tek transaction'da oluşturur. Ek olarak
-- istemcinin yapamadığı bir doğrulamayı yapar: teklif edilen ilanlar
-- gerçekten gönderene, istenen ilanlar gerçekten alıcıya ait mi?

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

  -- Teklif edilen ilanların tamamı gönderene ait olmalı.
  foreach v_listing_id in array p_offered_listing_ids loop
    if not exists (
      select 1 from public.listings
      where id = v_listing_id and owner_id = v_sender_id
    ) then
      raise exception 'Size ait olmayan bir ürünü teklif edemezsiniz.';
    end if;
  end loop;

  -- İstenen ilanların tamamı alıcıya ait olmalı.
  foreach v_listing_id in array p_requested_listing_ids loop
    if not exists (
      select 1 from public.listings
      where id = v_listing_id and owner_id = p_receiver_id
    ) then
      raise exception 'İstenen ürün, teklif gönderilen kullanıcıya ait değil.';
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


-- ── Teklif kabulü ───────────────────────────────────────────────────────────
-- Yalnızca teklifin ALICISI kabul edebilir. Teklif güncellemesi, trades
-- satırının oluşturulması ve olay kaydı tek transaction'da yapılır.

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
begin
  if v_uid is null then
    raise exception 'Giriş yapmalısınız.';
  end if;

  -- FOR UPDATE: aynı teklifin eşzamanlı iki kez kabul edilmesini engeller.
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

  update public.trade_offers
  set status = 'accepted', updated_at = now()
  where id = p_offer_id;

  insert into public.trades (offer_id, sender_id, receiver_id, status, delivery_method)
  values (
    v_offer.id, v_offer.sender_id, v_offer.receiver_id, 'locked',
    v_offer.proposed_delivery_method
  )
  returning id into v_trade_id;

  insert into public.trade_events (trade_id, actor_id, event_type, note)
  values (v_trade_id, v_uid, 'offer_accepted', 'Teklif kabul edildi, ürünler kilitlendi.');

  return v_trade_id;
end;
$$;

grant execute on function public.accept_trade_offer(uuid) to authenticated;


-- ── Teklif reddi ────────────────────────────────────────────────────────────

create or replace function public.reject_trade_offer(
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
  v_offer public.trade_offers%rowtype;
begin
  if v_uid is null then
    raise exception 'Giriş yapmalısınız.';
  end if;

  select * into v_offer from public.trade_offers where id = p_offer_id for update;

  if not found then
    raise exception 'Teklif bulunamadı.';
  end if;

  -- Alıcı reddedebilir; gönderen de kendi teklifini geri çekebilir.
  if v_uid not in (v_offer.receiver_id, v_offer.sender_id) then
    raise exception 'Bu teklif üzerinde yetkiniz yok.';
  end if;

  if v_offer.status not in ('offer_sent', 'counter_offered') then
    raise exception 'Bu teklif artık reddedilebilir durumda değil (%).', v_offer.status;
  end if;

  -- Gerekçe `message` kolonuna DEĞİL, kendi kolonuna yazılır: gönderenin
  -- orijinal notu korunur.
  update public.trade_offers
  set status = 'rejected',
      rejection_reason = p_reason,
      updated_at = now()
  where id = p_offer_id;
end;
$$;

grant execute on function public.reject_trade_offer(uuid, text) to authenticated;


-- ── Karşı teklif bağlama ────────────────────────────────────────────────────
-- Karşı teklifin kendisi create_trade_offer() ile oluşturulur (parent_offer_id
-- parametresiyle). Bu fonksiyon yalnızca orijinal teklifi 'counter_offered'
-- durumuna taşır — bunu istemciye bırakmak, teklifin tarafı olmayan birinin de
-- başkasının teklifinin durumunu değiştirebilmesi demekti.

create or replace function public.mark_offer_countered(p_original_offer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_offer public.trade_offers%rowtype;
begin
  select * into v_offer from public.trade_offers where id = p_original_offer_id for update;

  if not found then
    raise exception 'Teklif bulunamadı.';
  end if;

  if v_offer.receiver_id <> v_uid then
    raise exception 'Karşı teklifi yalnızca teklifin alıcısı verebilir.';
  end if;

  if v_offer.status not in ('offer_sent', 'counter_offered') then
    raise exception 'Bu teklife artık karşı teklif verilemez (%).', v_offer.status;
  end if;

  update public.trade_offers
  set status = 'counter_offered', updated_at = now()
  where id = p_original_offer_id;
end;
$$;

grant execute on function public.mark_offer_countered(uuid) to authenticated;


-- ── Takas adımlarını ilerletme ──────────────────────────────────────────────
-- Yalnızca takasın iki tarafından biri ilerletebilir. Adımların sırası
-- zorunlu: geri ya da atlayarak gidilemez.
--
-- Çevresel etki değerleri istemcide impactService (LCA katsayı tablosu) ile
-- hesaplanıp parametre olarak geçiliyor — katsayı tablosunu SQL'e kopyalamamak
-- için. Bu değerler henüz hiçbir yerde toplanmadığı için (raporda C-06) güvenlik
-- açısından kritik değil; etki toplamları profile bağlandığında hesaplama da
-- veritabanına taşınmalı.

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

  if p_target_step = 6 and p_impact is not null then
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
end;
$$;

grant execute on function public.advance_trade(uuid, integer, jsonb) to authenticated;

-- =============================================================================
-- SATIR BAZLI GÜVENLİK (RLS) — tüm public tablolar
-- =============================================================================
-- Önceki migration'lar 19 tablonun yalnızca 4'ünde RLS açmıştı
-- (conversations, messages, community_posts, post_likes). Geri kalan 15 tablo
-- tamamen korumasızdı: anon anahtar tarayıcıda görünür olduğu için herkes
-- herkesin profilini, ilanını, takasını ve güven puanını okuyup
-- değiştirebiliyordu.
--
-- Bu migration:
--   1. profiles tablosuna `role` kolonu ekler (admin yetkisi için)
--   2. is_admin() ve phone_exists() yardımcı fonksiyonlarını tanımlar
--   3. Korumasız 15 tablonun tamamında RLS açıp politikaları yazar
--   4. messages UPDATE politikasını daraltır (sadece is_read değişebilir)
--
-- ERİŞİM MODELİ
--   anon (giriş yapmamış ziyaretçi)
--     · Aktif ilanları, ilan fotoğraflarını, kategorileri ve güven puanlarını
--       okuyabilir — SplashPage'deki "Uygulamayı Keşfet" akışı çalışmaya devam
--       etsin diye. İlan sahiplerinin profil satırlarını GÖREMEZ; bu durumda
--       mapListing() zaten "Swaloop Kullanıcısı" fallback'ine düşer.
--     · Hiçbir yere yazamaz.
--   authenticated
--     · Profil dizinini okuyabilir; yalnızca kendi satırını yazabilir.
--     · Kendi ilanlarını, favorilerini, tekliflerini, takaslarını yönetir.
--     · Yalnızca tarafı olduğu takas ve konuşmaları görür.
--   admin (profiles.role = 'admin')
--     · Moderasyon için ilanların ve takasların tamamını görür/günceller.
--
-- NOT (bilinen kalan boşluk): profiles.phone kolonu, giriş yapmış diğer
-- kullanıcılara satır seviyesinde açık kalıyor — Postgres'te RLS satır
-- bazlıdır, kolon bazlı değildir. Uygulama tarafındaki tüm join'ler bu
-- migration'la birlikte açık kolon listesine çevrildi (telefon artık tel
-- üzerinden gitmiyor). Tam çözüm için ileride yalnızca güvenli kolonları
-- gösteren bir `profiles_public` view'ı (security definer) açılıp
-- embedded join'ler ona taşınmalı.
-- =============================================================================


-- ── 1. Admin rolü ───────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists role text not null default 'user';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_role_check'
  ) then
    alter table public.profiles
      add constraint profiles_role_check check (role in ('user', 'moderator', 'admin'));
  end if;
end
$$;

-- is_admin(): politikaların içinden çağrılır. SECURITY DEFINER olması şart —
-- aksi halde profiles üzerindeki politikanın içinden yine profiles okunur ve
-- sonsuz özyineleme (infinite recursion) hatası alınır.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'moderator')
  );
$$;

grant execute on function public.is_admin() to authenticated;


-- ── 2. Telefon kontrolü (kayıt akışı) ───────────────────────────────────────
-- Kayıt sırasında "bu numara zaten kayıtlı mı?" sorusunun sorulabilmesi için
-- anon'un profiles tablosunu okuması gerekiyordu. Artık gerekmiyor: kontrol
-- yalnızca boolean döndüren bu fonksiyona taşındı. Böylece anon, profiles
-- satırlarını hiç göremeden kayıt akışını tamamlayabiliyor.

create or replace function public.phone_exists(check_phone text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where phone = check_phone
  );
$$;

grant execute on function public.phone_exists(text) to anon, authenticated;


-- ── 3. profiles ─────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;

drop policy if exists profiles_select_authenticated on public.profiles;
create policy profiles_select_authenticated on public.profiles
  for select to authenticated
  using (true);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- `role` alanının kullanıcı tarafından yükseltilmesini engelleyen koruma.
-- RLS politikası OLD ve NEW satırlarını aynı anda karşılaştıramadığı için
-- bu kontrol trigger ile yapılıyor.
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Kullanıcı kendi rolünü değiştiremez.';
  end if;
  -- Profil satırının başka bir auth kullanıcısına taşınması da engelleniyor.
  if new.id is distinct from old.id then
    raise exception 'Profil kimliği değiştirilemez.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_profile_role on public.profiles;
create trigger trg_guard_profile_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();


-- ── 4. categories ───────────────────────────────────────────────────────────
-- Herkese açık okuma; yazma yalnızca service_role (politika tanımlanmadığı
-- için authenticated/anon yazamaz).

alter table public.categories enable row level security;

drop policy if exists categories_select_all on public.categories;
create policy categories_select_all on public.categories
  for select to anon, authenticated
  using (true);


-- ── 5. listings ─────────────────────────────────────────────────────────────

alter table public.listings enable row level security;

-- Moderasyonla kaldırılmış ilanlar yalnızca sahibine ve moderatöre görünür.
-- 'locked' / 'traded' gibi durumlar herkese açık kalır ki devam eden bir
-- takasın kalemleri teklif ekranında kaybolmasın.
drop policy if exists listings_select_visible on public.listings;
create policy listings_select_visible on public.listings
  for select to anon, authenticated
  using (
    status is distinct from 'removed'
    or auth.uid() = owner_id
    or public.is_admin()
  );

drop policy if exists listings_insert_own on public.listings;
create policy listings_insert_own on public.listings
  for insert to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists listings_update_own on public.listings;
create policy listings_update_own on public.listings
  for update to authenticated
  using (auth.uid() = owner_id or public.is_admin())
  with check (auth.uid() = owner_id or public.is_admin());

drop policy if exists listings_delete_own on public.listings;
create policy listings_delete_own on public.listings
  for delete to authenticated
  using (auth.uid() = owner_id or public.is_admin());


-- ── 6. listing_images ───────────────────────────────────────────────────────

alter table public.listing_images enable row level security;

drop policy if exists listing_images_select_all on public.listing_images;
create policy listing_images_select_all on public.listing_images
  for select to anon, authenticated
  using (true);

drop policy if exists listing_images_write_own on public.listing_images;
create policy listing_images_write_own on public.listing_images
  for insert to authenticated
  with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_images.listing_id and l.owner_id = auth.uid()
    )
  );

drop policy if exists listing_images_delete_own on public.listing_images;
create policy listing_images_delete_own on public.listing_images
  for delete to authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_images.listing_id
        and (l.owner_id = auth.uid() or public.is_admin())
    )
  );


-- ── 7. favorites ────────────────────────────────────────────────────────────

alter table public.favorites enable row level security;

drop policy if exists favorites_select_own on public.favorites;
create policy favorites_select_own on public.favorites
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists favorites_insert_own on public.favorites;
create policy favorites_insert_own on public.favorites
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists favorites_delete_own on public.favorites;
create policy favorites_delete_own on public.favorites
  for delete to authenticated
  using (auth.uid() = user_id);


-- ── 8. trade_offers ─────────────────────────────────────────────────────────

alter table public.trade_offers enable row level security;

drop policy if exists trade_offers_select_participant on public.trade_offers;
create policy trade_offers_select_participant on public.trade_offers
  for select to authenticated
  using (
    auth.uid() = sender_id
    or auth.uid() = receiver_id
    or public.is_admin()
  );

drop policy if exists trade_offers_insert_sender on public.trade_offers;
create policy trade_offers_insert_sender on public.trade_offers
  for insert to authenticated
  with check (auth.uid() = sender_id and sender_id is distinct from receiver_id);

-- Durum geçişleri (kabul / red / karşı teklif) artık RPC üzerinden yapılıyor
-- (bkz. 20260821090100_trade_rpcs.sql). İstemciden doğrudan UPDATE'e izin
-- verilmiyor: aksi halde teklifin alıcısı olmayan biri de teklifi kabul
-- edebilirdi.


-- ── 9. trade_offer_items ────────────────────────────────────────────────────

alter table public.trade_offer_items enable row level security;

drop policy if exists trade_offer_items_select_participant on public.trade_offer_items;
create policy trade_offer_items_select_participant on public.trade_offer_items
  for select to authenticated
  using (
    exists (
      select 1 from public.trade_offers o
      where o.id = trade_offer_items.offer_id
        and (auth.uid() = o.sender_id or auth.uid() = o.receiver_id or public.is_admin())
    )
  );

drop policy if exists trade_offer_items_insert_sender on public.trade_offer_items;
create policy trade_offer_items_insert_sender on public.trade_offer_items
  for insert to authenticated
  with check (
    exists (
      select 1 from public.trade_offers o
      where o.id = trade_offer_items.offer_id and o.sender_id = auth.uid()
    )
  );

drop policy if exists trade_offer_items_delete_sender on public.trade_offer_items;
create policy trade_offer_items_delete_sender on public.trade_offer_items
  for delete to authenticated
  using (
    exists (
      select 1 from public.trade_offers o
      where o.id = trade_offer_items.offer_id and o.sender_id = auth.uid()
    )
  );


-- ── 10. trades ──────────────────────────────────────────────────────────────

alter table public.trades enable row level security;

drop policy if exists trades_select_participant on public.trades;
create policy trades_select_participant on public.trades
  for select to authenticated
  using (
    auth.uid() = sender_id
    or auth.uid() = receiver_id
    or public.is_admin()
  );

-- INSERT / UPDATE yok: takas kaydı yalnızca RPC (security definer) tarafından
-- oluşturulur ve ilerletilir.


-- ── 11. trade_events ────────────────────────────────────────────────────────

alter table public.trade_events enable row level security;

drop policy if exists trade_events_select_participant on public.trade_events;
create policy trade_events_select_participant on public.trade_events
  for select to authenticated
  using (
    exists (
      select 1 from public.trades t
      where t.id = trade_events.trade_id
        and (auth.uid() = t.sender_id or auth.uid() = t.receiver_id or public.is_admin())
    )
  );


-- ── 12. reviews ─────────────────────────────────────────────────────────────

alter table public.reviews enable row level security;

-- Değerlendirmeler herkese açık: profil sayfasında gösteriliyor.
drop policy if exists reviews_select_all on public.reviews;
create policy reviews_select_all on public.reviews
  for select to anon, authenticated
  using (true);

-- Yalnızca takasın gerçek tarafı, karşı tarafı değerlendirebilir.
drop policy if exists reviews_insert_participant on public.reviews;
create policy reviews_insert_participant on public.reviews
  for insert to authenticated
  with check (
    auth.uid() = reviewer_id
    and reviewer_id is distinct from reviewed_user_id
    and exists (
      select 1 from public.trades t
      where t.id = reviews.trade_id
        and (auth.uid() = t.sender_id or auth.uid() = t.receiver_id)
        and (t.sender_id = reviews.reviewed_user_id or t.receiver_id = reviews.reviewed_user_id)
    )
  );

-- Aynı takas için aynı kişinin ikinci kez puan vermesini engeller.
create unique index if not exists reviews_unique_per_trade_reviewer_idx
  on public.reviews (trade_id, reviewer_id);


-- ── 13. trust_profiles ──────────────────────────────────────────────────────
-- Güven puanı ilan kartlarında herkese gösteriliyor, bu yüzden okuma açık.
-- Yazma politikası YOK: puanı yalnızca trigger'lar / RPC'ler (security
-- definer) günceller — kullanıcı kendi puanını yükseltemez.

alter table public.trust_profiles enable row level security;

drop policy if exists trust_profiles_select_all on public.trust_profiles;
create policy trust_profiles_select_all on public.trust_profiles
  for select to anon, authenticated
  using (true);


-- ── 14. trust_events ────────────────────────────────────────────────────────

alter table public.trust_events enable row level security;

drop policy if exists trust_events_select_own on public.trust_events;
create policy trust_events_select_own on public.trust_events
  for select to authenticated
  using (auth.uid() = user_id or public.is_admin());


-- ── 15. impact_records ──────────────────────────────────────────────────────

alter table public.impact_records enable row level security;

drop policy if exists impact_records_select_participant on public.impact_records;
create policy impact_records_select_participant on public.impact_records
  for select to authenticated
  using (
    exists (
      select 1 from public.trades t
      where t.id = impact_records.trade_id
        and (auth.uid() = t.sender_id or auth.uid() = t.receiver_id or public.is_admin())
    )
  );


-- ── 16. loops / loop_participants ───────────────────────────────────────────

alter table public.loops enable row level security;

drop policy if exists loops_select_all on public.loops;
create policy loops_select_all on public.loops
  for select to anon, authenticated
  using (true);

drop policy if exists loops_insert_own on public.loops;
create policy loops_insert_own on public.loops
  for insert to authenticated
  with check (auth.uid() = creator_id);

drop policy if exists loops_update_creator on public.loops;
create policy loops_update_creator on public.loops
  for update to authenticated
  using (auth.uid() = creator_id or public.is_admin())
  with check (auth.uid() = creator_id or public.is_admin());

alter table public.loop_participants enable row level security;

drop policy if exists loop_participants_select_all on public.loop_participants;
create policy loop_participants_select_all on public.loop_participants
  for select to anon, authenticated
  using (true);

drop policy if exists loop_participants_insert_own on public.loop_participants;
create policy loop_participants_insert_own on public.loop_participants
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists loop_participants_update_own on public.loop_participants;
create policy loop_participants_update_own on public.loop_participants
  for update to authenticated
  using (
    auth.uid() = user_id
    or exists (select 1 from public.loops l where l.id = loop_participants.loop_id and l.creator_id = auth.uid())
  )
  with check (
    auth.uid() = user_id
    or exists (select 1 from public.loops l where l.id = loop_participants.loop_id and l.creator_id = auth.uid())
  );

drop policy if exists loop_participants_delete_own on public.loop_participants;
create policy loop_participants_delete_own on public.loop_participants
  for delete to authenticated
  using (
    auth.uid() = user_id
    or exists (select 1 from public.loops l where l.id = loop_participants.loop_id and l.creator_id = auth.uid())
  );


-- ── 17. messages UPDATE politikasının daraltılması ──────────────────────────
-- Önceki politika, konuşmanın her iki tarafına da o konuşmadaki TÜM mesajları
-- güncelleme izni veriyordu — yani karşı taraf gönderilmiş bir mesajın metnini
-- değiştirebilirdi. Politika yorumu niyeti doğru anlatıyordu ("sadece is_read
-- için") ama bunu zorlamıyordu.
--
-- RLS politikası OLD/NEW karşılaştırması yapamadığı için kısıt trigger'a
-- taşındı: is_read dışında hiçbir kolon değiştirilemez.

create or replace function public.guard_message_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.id is distinct from old.id
     or new.conversation_id is distinct from old.conversation_id
     or new.sender_id is distinct from old.sender_id
     or new.content is distinct from old.content
     or new.type is distinct from old.type
     or new.trade_offer_id is distinct from old.trade_offer_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Mesajlarda yalnızca okundu bilgisi güncellenebilir.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_message_update on public.messages;
create trigger trg_guard_message_update
  before update on public.messages
  for each row execute function public.guard_message_update();

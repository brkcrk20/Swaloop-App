-- =============================================================================
-- categories tablosu seed'i
-- =============================================================================
-- listingService.createListing(), kategori slug'ını UUID'ye çevirmek için
-- `categories` tablosunu sorguluyor ve satır bulunamazsa sessizce vazgeçiyor
-- (undefined döner, hata yalnızca konsola düşer). Repodaki migration'lar
-- tabloyu oluşturuyordu ama içine hiç satır eklemiyordu — yani bu repodan
-- kurulan temiz bir ortamda (`supabase db reset`) hiç kimse ilan veremiyordu.
--
-- Slug'lar src/constants/index.ts'teki CATEGORIES listesi ve
-- src/types/index.ts'teki CategoryId union'ı ile birebir aynı olmak ZORUNDA.
--
-- `on conflict (slug) do nothing` sayesinde, kategorilerin zaten tanımlı
-- olduğu canlı veritabanında bu migration hiçbir şeyi değiştirmez.

insert into public.categories (name, slug, icon, is_active) values
  ('Elektronik',      'electronics',  'Laptop',   true),
  ('Spor & Outdoor',  'sports',       'Bike',     true),
  ('Ev & Yaşam',      'home-living',  'Home',     true),
  ('Giyim & Moda',    'fashion',      'Shirt',    true),
  ('Hobi & Oyun',     'hobby',        'Gamepad2', true),
  ('Kitap',           'books',        'BookOpen', true),
  ('Müzik',           'music',        'Music',    true),
  ('Fotoğraf',        'photography',  'Camera',   true),
  ('Koleksiyon',      'collectibles', 'Sparkles', true),
  ('Diğer',           'other',        'Package',  true)
on conflict (slug) do nothing;

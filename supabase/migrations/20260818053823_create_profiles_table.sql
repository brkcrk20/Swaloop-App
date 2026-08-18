-- NOT: Bu dosya canlı projede boştu (0 byte) ama profiles tablosu zaten
-- canlıda mevcuttu. Migration geçmişinin canlı DB ile eşleşmesi için,
-- üretilmiş TypeScript tiplerinden (src/types/supabase.ts) geri
-- türetilerek dolduruldu. "if not exists" kullanıldığı için canlı DB'ye
-- tekrar uygulansa bile mevcut veriyi bozmaz.
--
-- ÖNEMLİ: RLS politikaları burada YOK, çünkü hangi politikaların canlıda
-- gerçekten tanımlı olduğunu bu ortamdan doğrulayamadım (elimdeki CSV
-- sadece foreign key ve fonksiyon listesi içeriyor, policy listesi yok).
-- Gerçek satır bazlı güvenlik kurallarınızı repoya işlemek için:
--   supabase db pull
-- komutunu çalıştırıp oluşan migration dosyasını bu projeye eklemenizi
-- öneririm — bu, tahmin değil, canlı DB'nin birebir dökümünü verir.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text not null,
  full_name text,
  avatar_url text,
  bio text,
  city text,
  district text,
  username text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

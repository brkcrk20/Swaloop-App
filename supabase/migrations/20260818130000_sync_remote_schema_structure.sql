-- =============================================================================
-- Bu migration, src/types/supabase.ts (Supabase CLI ile üretilmiş tipler) ve
-- Supabase_Snippet_Untitled_query.csv (foreign key + function dökümü) baz
-- alınarak, canlıda zaten var olan ama migration geçmişinde HİÇ karşılığı
-- olmayan 13 tabloyu geri türetir. Amaç: `supabase db reset` çalıştırıldığında
-- gerçek proje ile aynı şema kurulabilsin.
--
-- KAPSAM DIŞI (bilerek): RLS politikaları, index'ler (FK dışında), check
-- constraint'ler, trigger'ların bir kısmı. Bunlar CSV dökümünde yer almıyordu
-- ya da bu ortamdan doğrulanamadı. Bu yüzden burada UYDURULMADI.
--
-- YAPILMASI GEREKEN: Bu dosyayı gerçek kaynağın yerine geçecek şekilde değil,
-- geçici bir iskelet olarak görün. Otoriter/eksiksiz (RLS + policy + index
-- dahil) bir migration için:
--     supabase db pull
-- komutunu kendi makinenizde çalıştırıp çıkan dosyayı bu klasöre ekleyin.
-- =============================================================================

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  category_id uuid references public.categories(id),
  title text not null,
  description text,
  condition text,
  city text,
  district text,
  latitude double precision,
  longitude double precision,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
  -- looking_for / delivery_options / tags / view_count / favorite_count
  -- kolonları 20260818120000_add_listing_fields.sql migration'ında ekleniyor.
);

create table if not exists public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  storage_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, listing_id)
);

create table if not exists public.loops (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id),
  title text not null,
  description text,
  max_participants integer,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.loop_participants (
  id uuid primary key default gen_random_uuid(),
  loop_id uuid not null references public.loops(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  role text not null default 'member',
  status text not null default 'active',
  joined_at timestamptz not null default now()
);

create table if not exists public.trade_offers (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id),
  receiver_id uuid not null references public.profiles(id),
  parent_offer_id uuid references public.trade_offers(id),
  status text not null default 'offer_sent',
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trade_offer_items (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.trade_offers(id) on delete cascade,
  listing_id uuid not null references public.listings(id),
  owner_id uuid not null references public.profiles(id),
  role text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.trade_offers(id),
  sender_id uuid not null references public.profiles(id),
  receiver_id uuid not null references public.profiles(id),
  status text not null default 'locked',
  delivery_method text,
  delivery_notes text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.trade_events (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid not null references public.trades(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  event_type text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid not null references public.trades(id),
  reviewer_id uuid not null references public.profiles(id),
  reviewed_user_id uuid not null references public.profiles(id),
  rating numeric not null,
  comment text,
  communication_rating numeric,
  delivery_rating numeric,
  item_accuracy_rating numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.trust_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  trust_score numeric not null default 5,
  verification_level text not null default 'başlangıç',
  completed_trades integer not null default 0,
  cancelled_trades integer not null default 0,
  response_rate numeric not null default 1,
  updated_at timestamptz not null default now()
);

create table if not exists public.trust_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  event_type text not null,
  note text,
  review_id uuid references public.reviews(id),
  score_change numeric,
  trade_id uuid references public.trades(id),
  created_at timestamptz not null default now()
);

create table if not exists public.impact_records (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid not null unique references public.trades(id),
  co2e_kg numeric not null default 0,
  energy_kwh numeric not null default 0,
  material_kg numeric not null default 0,
  waste_kg numeric not null default 0,
  water_liters numeric not null default 0,
  reuse_count integer not null default 0,
  methodology_version text not null default 'v1',
  calculated_at timestamptz not null default now()
);

-- create_trust_profile: profiles tablosuna yeni satır eklendiğinde
-- otomatik olarak trust_profiles satırı açan trigger. Fonksiyon canlıda
-- zaten var (CSV dökümünden doğrulandı); burada sadece tetikleyiciyi
-- (varsa) yeniden bağlıyoruz ki yeni bir ortamda da profil oluşturulunca
-- trust_profiles otomatik oluşsun.
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
  return new;
end;
$$;

drop trigger if exists trg_create_trust_profile on public.profiles;
create trigger trg_create_trust_profile
  after insert on public.profiles
  for each row execute function public.create_trust_profile();

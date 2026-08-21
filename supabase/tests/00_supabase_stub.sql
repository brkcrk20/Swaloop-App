-- Supabase ortamının yerel Postgres üzerinde test için asgari taklidi.
-- Gerçek Supabase kurulumunda BU DOSYA UYGULANMAZ; yalnızca
-- supabase/tests/run.sh tarafından, migration testleri için kullanılır.

-- Supabase ortamının test için asgari taklidi
do $$ begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if;
end $$;
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

create schema if not exists auth;
create table auth.users (id uuid primary key default gen_random_uuid(), phone text);

-- Supabase'de auth.uid() JWT'den okur; testte oturum değişkeninden okuyoruz.
create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
grant select on auth.users to anon, authenticated, service_role;

create schema if not exists storage;
create table storage.buckets (
  id text primary key, name text, public boolean,
  file_size_limit bigint, allowed_mime_types text[]
);
create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id),
  name text, owner uuid
);
alter table storage.objects enable row level security;
create or replace function storage.foldername(name text) returns text[]
language sql immutable as $$ select string_to_array(name, '/'); $$;
grant usage on schema storage to anon, authenticated;
grant all on storage.objects to anon, authenticated;

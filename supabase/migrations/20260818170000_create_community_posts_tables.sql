-- Topluluk gönderileri (community posts) — canlıda hiç tablo yoktu,
-- `communityService.ts` tamamen `INITIAL_COMMUNITY_POSTS` mock verisiyle
-- çalışıyordu. Bu turda sadece "gönderiler" (posts) kısmı ele alındı;
-- etkinlikler (`EventsPage.tsx`, tamamen ayrı ve hâlâ hardcoded) ve
-- rozetler (`BadgesPage.tsx`, hâlâ hardcoded) bu migration'ın KAPSAMI
-- DIŞINDA — bkz. swaloop-devam-plani.md §11.4.
--
-- Yorum (comment) özelliği için ayrı bir tablo açılmadı: frontend'de
-- `commentsCount` alanı var ama gönderiye yorum yazan bir UI hiç yok
-- (sadece sayı gösteriliyor) — bu yüzden `comments_count` düz bir
-- sayaç kolonu olarak tutuluyor, ileride gerçek bir `post_comments`
-- tablosu gerekirse bu kolon o tabloya göre yeniden hesaplanabilir.

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  content text not null,
  tags text[] not null default '{}',
  trade_item_given text,
  trade_item_received text,
  trade_co2_saved numeric,
  likes_count integer not null default 0,
  comments_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

-- Beğeni sayısını post_likes ile senkron tutan trigger (istemci tarafında
-- ayrıca +1/-1 hesaplamak yerine, yarış durumlarına karşı güvenli).
create or replace function public.sync_post_likes_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.community_posts set likes_count = likes_count + 1 where id = new.post_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.community_posts set likes_count = greatest(0, likes_count - 1) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists post_likes_sync_count on public.post_likes;
create trigger post_likes_sync_count
  after insert or delete on public.post_likes
  for each row execute function public.sync_post_likes_count();

alter table public.community_posts enable row level security;
alter table public.post_likes enable row level security;

drop policy if exists community_posts_select_all on public.community_posts;
create policy community_posts_select_all
  on public.community_posts for select
  using (true);

drop policy if exists community_posts_insert_own on public.community_posts;
create policy community_posts_insert_own
  on public.community_posts for insert
  with check (auth.uid() = author_id);

drop policy if exists community_posts_update_own on public.community_posts;
create policy community_posts_update_own
  on public.community_posts for update
  using (auth.uid() = author_id);

drop policy if exists community_posts_delete_own on public.community_posts;
create policy community_posts_delete_own
  on public.community_posts for delete
  using (auth.uid() = author_id);

drop policy if exists post_likes_select_all on public.post_likes;
create policy post_likes_select_all
  on public.post_likes for select
  using (true);

drop policy if exists post_likes_insert_own on public.post_likes;
create policy post_likes_insert_own
  on public.post_likes for insert
  with check (auth.uid() = user_id);

drop policy if exists post_likes_delete_own on public.post_likes;
create policy post_likes_delete_own
  on public.post_likes for delete
  using (auth.uid() = user_id);

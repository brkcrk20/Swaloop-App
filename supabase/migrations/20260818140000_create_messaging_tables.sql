-- Mesajlaşma özelliği için gerekli tablolar.
-- Plan (swaloop-devam-plani.md) §6 madde 1: "messages/conversations tabloları
-- için önce migration yazılmalı (DB'de hiç yok)". Bu dosya o adımı tamamlıyor.
--
-- Önceki migration'ların aksine (canlıda zaten var olan tabloları geriye
-- dönük tanımlayan `IF NOT EXISTS` dosyaları), bu migration TAMAMEN YENİ
-- tablolar oluşturuyor — yani canlı veritabanında henüz bu tablolar yok ve
-- bu migration'ın gerçekten `supabase db push` ile (veya CLI ile) canlıya
-- uygulanması GEREKİYOR. Sadece yerel `tsc`/`vite build` ile doğrulanamaz,
-- bkz. plan §5.4.
--
-- Tasarım kararları:
--  - Bir kullanıcı çifti arasında tek bir `conversations` satırı olur
--    (katılımcı sırası önemsiz), bunu `participant_one_id < participant_two_id`
--    kısıtıyla ve normalize edilmiş bir unique index ile garanti ediyoruz.
--  - `messages.type` frontend'deki `Message['type']` union'ı ile birebir
--    eşleşiyor (`src/types/index.ts` satır ~180): text / trade_card /
--    counter_card / delivery_card / system_card.
--  - RLS: sadece konuşmanın iki tarafı da kendi satırlarını görebilir/
--    yazabilir. `profiles.id = auth.users.id` olduğu için (bkz.
--    20260818053823_create_profiles_table.sql) doğrudan `auth.uid()`
--    kullanılabiliyor.

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  participant_one_id uuid not null references public.profiles(id) on delete cascade,
  participant_two_id uuid not null references public.profiles(id) on delete cascade,
  related_listing_id uuid references public.listings(id) on delete set null,
  active_trade_offer_id uuid references public.trade_offers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_distinct_participants check (participant_one_id <> participant_two_id)
);

-- İki kullanıcı arasında tekrar eden konuşma satırı açılmasını engeller
-- (katılımcı sırasından bağımsız olarak).
create unique index if not exists conversations_unique_pair_idx
  on public.conversations (least(participant_one_id, participant_two_id), greatest(participant_one_id, participant_two_id));

create index if not exists conversations_participant_one_idx on public.conversations (participant_one_id);
create index if not exists conversations_participant_two_idx on public.conversations (participant_two_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  type text not null default 'text'
    check (type in ('text', 'trade_card', 'counter_card', 'delivery_card', 'system_card')),
  trade_offer_id uuid references public.trade_offers(id) on delete set null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_id_idx on public.messages (conversation_id, created_at);
create index if not exists messages_sender_id_idx on public.messages (sender_id);

-- conversations.updated_at'i her yeni mesajda otomatik güncelle (konuşma
-- listesini "son mesaja göre sırala" mantığı için).
create or replace function public.touch_conversation_on_new_message()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.conversations
  set updated_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists trg_touch_conversation_on_new_message on public.messages;
create trigger trg_touch_conversation_on_new_message
  after insert on public.messages
  for each row execute function public.touch_conversation_on_new_message();

-- ── RLS ─────────────────────────────────────────────────────────────────
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "conversations_select_own" on public.conversations;
create policy "conversations_select_own" on public.conversations
  for select using (auth.uid() = participant_one_id or auth.uid() = participant_two_id);

drop policy if exists "conversations_insert_own" on public.conversations;
create policy "conversations_insert_own" on public.conversations
  for insert with check (auth.uid() = participant_one_id or auth.uid() = participant_two_id);

drop policy if exists "conversations_update_own" on public.conversations;
create policy "conversations_update_own" on public.conversations
  for update using (auth.uid() = participant_one_id or auth.uid() = participant_two_id);

drop policy if exists "messages_select_own_conversation" on public.messages;
create policy "messages_select_own_conversation" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (auth.uid() = c.participant_one_id or auth.uid() = c.participant_two_id)
    )
  );

drop policy if exists "messages_insert_own_conversation" on public.messages;
create policy "messages_insert_own_conversation" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (auth.uid() = c.participant_one_id or auth.uid() = c.participant_two_id)
    )
  );

-- Karşı taraf "okundu" işaretlemesi yapabilsin diye update politikası da
-- ekleniyor (sadece is_read alanını kendi almadığı mesajlarda değiştirmek
-- için kullanılacak; uygulama tarafı sadece is_read günceller).
drop policy if exists "messages_update_own_conversation" on public.messages;
create policy "messages_update_own_conversation" on public.messages
  for update using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (auth.uid() = c.participant_one_id or auth.uid() = c.participant_two_id)
    )
  );

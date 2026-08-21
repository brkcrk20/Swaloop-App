\set ON_ERROR_STOP off
\pset pager off
\pset tuples_only on
\pset format unaligned

-- ── Seed (superuser) ──────────────────────────────────────────────────────
insert into auth.users (id, phone) values
  ('11111111-1111-1111-1111-111111111111','+905550000001'),
  ('22222222-2222-2222-2222-222222222222','+905550000002'),
  ('33333333-3333-3333-3333-333333333333','+905550000003');
insert into public.profiles (id, phone, full_name, city) values
  ('11111111-1111-1111-1111-111111111111','+905550000001','Ayse','Istanbul'),
  ('22222222-2222-2222-2222-222222222222','+905550000002','Berk','Istanbul'),
  ('33333333-3333-3333-3333-333333333333','+905550000003','Cem','Izmir');
insert into public.listings (id, owner_id, category_id, title, status)
select 'aaaaaaaa-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',c.id,'Ayse kamera','active' from public.categories c where c.slug='photography';
insert into public.listings (id, owner_id, category_id, title, status)
select 'bbbbbbbb-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222',c.id,'Berk bisiklet','active' from public.categories c where c.slug='sports';
insert into public.conversations (id, participant_one_id, participant_two_id) values
  ('cccccccc-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222');
insert into public.messages (id, conversation_id, sender_id, content) values
  ('dddddddd-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Merhaba');

\echo '=================== RLS SALDIRI TESTLERI ==================='

set role anon;
select 'T01 anon profil okuyamiyor          [0 bekleniyor] -> ' || count(*) from public.profiles;
select 'T02 anon aktif ilanlari okuyabiliyor[2 bekleniyor] -> ' || count(*) from public.listings;
select 'T03 anon kayit icin telefon sorabiliyor [t bekleniyor] -> ' || public.phone_exists('+905550000001')::text;
select 'T04 anon mesaj okuyamiyor           [0 bekleniyor] -> ' || count(*) from public.messages;
reset role;

set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select 'T05 Ayse profil dizinini goruyor    [3 bekleniyor] -> ' || count(*) from public.profiles;

\echo '--- T06 Ayse, Berk in profilini degistiriyor [0 satir bekleniyor]'
update public.profiles set full_name='HACKED' where id='22222222-2222-2222-2222-222222222222';
\echo '--- T07 Ayse kendini admin yapiyor [HATA bekleniyor]'
update public.profiles set role='admin' where id='11111111-1111-1111-1111-111111111111';
\echo '--- T08 Ayse, Berk in ilanini siliyor [0 satir bekleniyor]'
delete from public.listings where id='bbbbbbbb-0000-0000-0000-000000000002';
\echo '--- T09 Ayse guven puanini yukseltiyor [0 satir bekleniyor]'
update public.trust_profiles set trust_score=5 where user_id='11111111-1111-1111-1111-111111111111';
\echo '--- T10 Ayse, Berk in ilanini kendisininmis gibi teklif ediyor [HATA bekleniyor]'
select public.create_trade_offer('33333333-3333-3333-3333-333333333333',
  array['bbbbbbbb-0000-0000-0000-000000000002']::uuid[],
  array['aaaaaaaa-0000-0000-0000-000000000001']::uuid[], null,'cargo',null);

select public.create_trade_offer('22222222-2222-2222-2222-222222222222',
  array['aaaaaaaa-0000-0000-0000-000000000001']::uuid[],
  array['bbbbbbbb-0000-0000-0000-000000000002']::uuid[],
  'ORIJINAL NOT','cargo',null) as offer_id \gset
select 'T11 Ayse gecerli teklif gonderdi    [uuid bekleniyor] -> ' || :'offer_id';

\echo '--- T12 Ayse KENDI gonderdigi teklifi kabul ediyor [HATA bekleniyor]'
select public.accept_trade_offer(:'offer_id');

set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select 'T13 Cem baskasinin teklifini goremiyor [0 bekleniyor] -> ' || count(*) from public.trade_offers;
select 'T14 Cem teklif kalemlerini goremiyor   [0 bekleniyor] -> ' || count(*) from public.trade_offer_items;
select 'T15 Cem baskasinin mesajini goremiyor  [0 bekleniyor] -> ' || count(*) from public.messages;
\echo '--- T16 Cem, Ayse-Berk teklifini kabul ediyor [HATA bekleniyor]'
select public.accept_trade_offer(:'offer_id');

set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select 'T17 Berk kendine gelen teklifi goruyor [1 bekleniyor] -> ' || count(*) from public.trade_offers;
select public.accept_trade_offer(:'offer_id') as trade_id \gset
select 'T18 Berk teklifi kabul etti            [uuid bekleniyor] -> ' || :'trade_id';
select 'T19 trades satiri olustu               [1 bekleniyor] -> ' || count(*) from public.trades;
select 'T20 trade_events kaydi dusuldu         [1 bekleniyor] -> ' || count(*) from public.trade_events;
select 'T21 olay actor_id dolu                 [t bekleniyor] -> ' || (actor_id is not null)::text from public.trade_events;
select 'T22 teklif durumu                      [accepted bekleniyor] -> ' || status from public.trade_offers where id=:'offer_id';
select 'T23 teslimat tercihi trades a tasindi  [cargo bekleniyor] -> ' || coalesce(delivery_method,'BOS') from public.trades;

\echo '--- T24 Berk ayni teklifi ikinci kez kabul ediyor [HATA bekleniyor]'
select public.accept_trade_offer(:'offer_id');
\echo '--- T25 Berk 4. adimi atlayip 5 e geciyor [HATA bekleniyor]'
select public.advance_trade(:'offer_id',5,null);
select public.advance_trade(:'offer_id',4,null);
select 'T26 Berk 4. adima gecti                [delivery_planned bekleniyor] -> ' || status from public.trades;

set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
\echo '--- T27 Cem tarafi olmadigi takasi ilerletiyor [HATA bekleniyor]'
select public.advance_trade(:'offer_id',5,null);
\echo '--- T28 Cem tarafi olmadigi takasa puan veriyor [HATA bekleniyor]'
insert into public.reviews (trade_id, reviewer_id, reviewed_user_id, rating)
values (:'trade_id','33333333-3333-3333-3333-333333333333','11111111-1111-1111-1111-111111111111',5);

-- T18'de kabul edilen takas ilk iki ilani kilitledigi icin bu bolum taze
-- ilanlarla calisiyor (kilitli urun artik teklif edilemiyor).
reset role;
insert into public.listings (id, owner_id, category_id, title, status)
select 'aaaaaaaa-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111',c.id,'Ayse kitap','active' from public.categories c where c.slug='books';
insert into public.listings (id, owner_id, category_id, title, status)
select 'bbbbbbbb-0000-0000-0000-000000000004','22222222-2222-2222-2222-222222222222',c.id,'Berk gitar','active' from public.categories c where c.slug='music';
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select public.create_trade_offer('22222222-2222-2222-2222-222222222222',
  array['aaaaaaaa-0000-0000-0000-000000000003']::uuid[],
  array['bbbbbbbb-0000-0000-0000-000000000004']::uuid[],
  'IKINCI ORIJINAL NOT','in_person',null) as offer2 \gset
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select public.reject_trade_offer(:'offer2','Ilgilenmiyorum');
select 'T29 red sonrasi orijinal not korundu  [IKINCI ORIJINAL NOT] -> ' || message from public.trade_offers where id=:'offer2';
select 'T30 red gerekcesi ayri kolonda        [Ilgilenmiyorum] -> ' || rejection_reason from public.trade_offers where id=:'offer2';

\echo '--- T31 Berk, Ayse nin mesaj metnini degistiriyor [HATA bekleniyor]'
update public.messages set content='DEGISTIRILDI' where id='dddddddd-0000-0000-0000-000000000001';
update public.messages set is_read=true where id='dddddddd-0000-0000-0000-000000000001';
select 'T32 Berk mesaji okundu isaretleyebildi [t bekleniyor] -> ' || is_read::text from public.messages where id='dddddddd-0000-0000-0000-000000000001';
select 'T33 mesaj metni degismedi              [Merhaba bekleniyor] -> ' || content from public.messages where id='dddddddd-0000-0000-0000-000000000001';
reset role;
\echo '=================== BITTI ==================='

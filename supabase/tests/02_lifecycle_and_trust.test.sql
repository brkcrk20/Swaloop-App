-- İlan yaşam döngüsü, takas iptali, güven puanı ve istatistik toplama testleri.
-- 01_rls_policies.test.sql'den bağımsızdır; kendi verisini kurar.

\set ON_ERROR_STOP off
\pset pager off
\pset tuples_only on
\pset format unaligned

insert into auth.users (id, phone) values
  ('aaaa0000-0000-0000-0000-00000000000a','+905551110001'),
  ('bbbb0000-0000-0000-0000-00000000000b','+905551110002'),
  ('cccc0000-0000-0000-0000-00000000000c','+905551110003');
insert into public.profiles (id, phone, full_name, city) values
  ('aaaa0000-0000-0000-0000-00000000000a','+905551110001','Deniz','Ankara'),
  ('bbbb0000-0000-0000-0000-00000000000b','+905551110002','Elif','Ankara'),
  ('cccc0000-0000-0000-0000-00000000000c','+905551110003','Fatih','Bursa');

insert into public.listings (id, owner_id, category_id, title, status)
select 'd0000000-0000-0000-0000-000000000001','aaaa0000-0000-0000-0000-00000000000a',c.id,'Deniz dron','active' from public.categories c where c.slug='photography';
insert into public.listings (id, owner_id, category_id, title, status)
select 'e0000000-0000-0000-0000-000000000002','bbbb0000-0000-0000-0000-00000000000b',c.id,'Elif kayak','active' from public.categories c where c.slug='sports';
insert into public.listings (id, owner_id, category_id, title, status)
select 'f0000000-0000-0000-0000-000000000003','cccc0000-0000-0000-0000-00000000000c',c.id,'Fatih konsol','active' from public.categories c where c.slug='hobby';

\echo '============ YASAM DONGUSU + GUVEN PUANI ============'

set role authenticated;

-- ── Baslangic durumu ──────────────────────────────────────────────────────
set request.jwt.claim.sub = 'aaaa0000-0000-0000-0000-00000000000a';
select 'L01 yeni uye guven puani           [3.00 bekleniyor] -> ' || trust_score from public.trust_profiles where user_id='aaaa0000-0000-0000-0000-00000000000a';
select 'L02 yeni uye ortalama puani        [BOS bekleniyor]  -> ' || coalesce(average_rating::text,'BOS') from public.trust_profiles where user_id='aaaa0000-0000-0000-0000-00000000000a';
select 'L03 yeni uye degerlendirme sayisi  [0 bekleniyor]    -> ' || review_count from public.trust_profiles where user_id='aaaa0000-0000-0000-0000-00000000000a';

-- ── Iki rakip teklif: Deniz->Elif ve Fatih->Elif ayni urunu istiyor ───────
select public.create_trade_offer('bbbb0000-0000-0000-0000-00000000000b',
  array['d0000000-0000-0000-0000-000000000001']::uuid[],
  array['e0000000-0000-0000-0000-000000000002']::uuid[], 'Dron<->Kayak','cargo',null) as o1 \gset

set request.jwt.claim.sub = 'cccc0000-0000-0000-0000-00000000000c';
select public.create_trade_offer('bbbb0000-0000-0000-0000-00000000000b',
  array['f0000000-0000-0000-0000-000000000003']::uuid[],
  array['e0000000-0000-0000-0000-000000000002']::uuid[], 'Konsol<->Kayak','cargo',null) as o2 \gset

-- ── Elif ilk teklifi kabul ediyor ────────────────────────────────────────
set request.jwt.claim.sub = 'bbbb0000-0000-0000-0000-00000000000b';
select public.accept_trade_offer(:'o1') as t1 \gset

select 'L04 kabul sonrasi Deniz in urunu   [locked bekleniyor] -> ' || status from public.listings where id='d0000000-0000-0000-0000-000000000001';
select 'L05 kabul sonrasi Elif in urunu    [locked bekleniyor] -> ' || status from public.listings where id='e0000000-0000-0000-0000-000000000002';
select 'L06 rakip teklif otomatik kapandi  [rejected bekleniyor] -> ' || status from public.trade_offers where id=:'o2';
select 'L07 rakip teklif gerekcesi         [dolu bekleniyor] -> ' || coalesce(rejection_reason,'BOS') from public.trade_offers where id=:'o2';

-- ── Kilitli urun yeniden teklif edilemez ─────────────────────────────────
set request.jwt.claim.sub = 'cccc0000-0000-0000-0000-00000000000c';
\echo '--- L08 Fatih kilitli urunu tekrar istiyor [HATA bekleniyor]'
select public.create_trade_offer('bbbb0000-0000-0000-0000-00000000000b',
  array['f0000000-0000-0000-0000-000000000003']::uuid[],
  array['e0000000-0000-0000-0000-000000000002']::uuid[], null,'cargo',null);

\echo '--- L09 Fatih tarafi olmadigi takasi iptal ediyor [HATA bekleniyor]'
select public.cancel_trade(:'o1','olmaz');

-- ── Iptal: urunler serbest kalmali ───────────────────────────────────────
set request.jwt.claim.sub = 'aaaa0000-0000-0000-0000-00000000000a';
select public.cancel_trade(:'o1','Karsi taraf ulasilamadi');
select 'L10 iptal sonrasi Deniz in urunu   [active bekleniyor] -> ' || status from public.listings where id='d0000000-0000-0000-0000-000000000001';
select 'L11 iptal sonrasi Elif in urunu    [active bekleniyor] -> ' || status from public.listings where id='e0000000-0000-0000-0000-000000000002';
select 'L12 takas durumu                   [cancelled bekleniyor] -> ' || status from public.trades where id=:'t1';
select 'L13 iptal guven puanina yansidi    [1 bekleniyor] -> ' || cancelled_trades from public.trust_profiles where user_id='aaaa0000-0000-0000-0000-00000000000a';
select 'L14 iptal sonrasi puan dustu       [2.70 bekleniyor] -> ' || trust_score from public.trust_profiles where user_id='aaaa0000-0000-0000-0000-00000000000a';

\echo '--- L15 iptal edilmis takas ilerletiliyor [HATA bekleniyor]'
select public.advance_trade(:'o1',4,null);

-- ── Bastan tam bir takas: 6 adim + etki kaydi ────────────────────────────
select public.create_trade_offer('bbbb0000-0000-0000-0000-00000000000b',
  array['d0000000-0000-0000-0000-000000000001']::uuid[],
  array['e0000000-0000-0000-0000-000000000002']::uuid[], 'Ikinci deneme','in_person',null) as o3 \gset

set request.jwt.claim.sub = 'bbbb0000-0000-0000-0000-00000000000b';
select public.accept_trade_offer(:'o3') as t3 \gset
select public.advance_trade(:'o3',4,null);
select public.advance_trade(:'o3',5,null);
select public.advance_trade(:'o3',6,
  '{"co2eKg":12.5,"waterLiters":300,"energyKwh":40,"rawMaterialKg":2.0,"wasteReductionKg":1.5,"reuseCount":2,"methodologyVersion":"SVS-v2.1"}'::jsonb);

select 'L16 tamamlanan takasta urun durumu [traded bekleniyor] -> ' || status from public.listings where id='d0000000-0000-0000-0000-000000000001';
select 'L17 etki kaydi yazildi             [12.5 bekleniyor] -> ' || co2e_kg from public.impact_records where trade_id=:'t3';
select 'L18 tamamlanan takas sayaci arttı  [1 bekleniyor] -> ' || completed_trades from public.trust_profiles where user_id='bbbb0000-0000-0000-0000-00000000000b';
select 'L19 trust_events kaydi dusuldu     [>0 bekleniyor] -> ' || count(*) from public.trust_events where user_id='bbbb0000-0000-0000-0000-00000000000b';

-- ── Degerlendirme -> guven puani ─────────────────────────────────────────
insert into public.reviews (trade_id, reviewer_id, reviewed_user_id, rating, comment)
values (:'t3','bbbb0000-0000-0000-0000-00000000000b','aaaa0000-0000-0000-0000-00000000000a',5,'Harika');

select 'L20 degerlendirme sayisi guncellendi [1 bekleniyor] -> ' || review_count from public.trust_profiles where user_id='aaaa0000-0000-0000-0000-00000000000a';
select 'L21 ortalama puan hesaplandi         [5.00 bekleniyor] -> ' || average_rating from public.trust_profiles where user_id='aaaa0000-0000-0000-0000-00000000000a';
select 'L22 guven puani yeniden hesaplandi   [4.77 bekleniyor] -> ' || trust_score from public.trust_profiles where user_id='aaaa0000-0000-0000-0000-00000000000a';

\echo '--- L23 Elif ayni takasa ikinci kez puan veriyor [HATA bekleniyor]'
insert into public.reviews (trade_id, reviewer_id, reviewed_user_id, rating)
values (:'t3','bbbb0000-0000-0000-0000-00000000000b','aaaa0000-0000-0000-0000-00000000000a',1);

\echo '--- L24 Deniz kendi guven puanini elle yukseltiyor [0 satir bekleniyor]'
set request.jwt.claim.sub = 'aaaa0000-0000-0000-0000-00000000000a';
update public.trust_profiles set trust_score=5.0 where user_id='aaaa0000-0000-0000-0000-00000000000a';
select 'L24 puan degismedi mi              [4.77 bekleniyor] -> ' || trust_score from public.trust_profiles where user_id='aaaa0000-0000-0000-0000-00000000000a';

-- ── Istatistikler ───────────────────────────────────────────────────────
select 'L25 Deniz toplam CO2 tasarrufu     [12.5 bekleniyor] -> ' || co2e_kg from public.get_user_stats('aaaa0000-0000-0000-0000-00000000000a');
select 'L26 Deniz tamamlanan takas         [1 bekleniyor] -> ' || completed_trades from public.get_user_stats('aaaa0000-0000-0000-0000-00000000000a');
select 'L27 Deniz aktif ilan sayisi        [0 bekleniyor] -> ' || active_listings from public.get_user_stats('aaaa0000-0000-0000-0000-00000000000a');
select 'L28 Fatih toplam CO2 (takasi yok)  [0 bekleniyor] -> ' || co2e_kg from public.get_user_stats('cccc0000-0000-0000-0000-00000000000c');

-- ── Goruntulenme sayaci ─────────────────────────────────────────────────
set request.jwt.claim.sub = 'cccc0000-0000-0000-0000-00000000000c';
select public.increment_listing_view('f0000000-0000-0000-0000-000000000003');
select 'L29 kendi ilanina bakinca artmiyor [0 bekleniyor] -> ' || view_count from public.listings where id='f0000000-0000-0000-0000-000000000003';
set request.jwt.claim.sub = 'aaaa0000-0000-0000-0000-00000000000a';
select public.increment_listing_view('f0000000-0000-0000-0000-000000000003');
select public.increment_listing_view('f0000000-0000-0000-0000-000000000003');
select 'L30 baskasi bakinca artiyor        [2 bekleniyor] -> ' || view_count from public.listings where id='f0000000-0000-0000-0000-000000000003';

reset role;
\echo '============ BITTI ============'

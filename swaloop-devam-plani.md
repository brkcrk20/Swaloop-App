# Swaloop — Supabase Entegrasyonu Devam Planı

> **GÜNCELLEME (bu turda):** Takas sistemi bağlama işi (aşağıdaki §5) artık
> **tamamlandı** — `tradeService.ts` tamamen yeniden yazıldı, 8 sayfanın
> tamamı async'e çevrildi, `npx tsc --noEmit` ve `npx vite build` hatasız
> geçti. Ayrıntılar için §5.6'ya bakın. Bir sonraki oturumda §6'daki
> maddelerden birine geçilebilir (önerilen sıra: mesajlaşma → fotoğraf
> yükleme → loop → topluluk).

Bu doküman, yeni bir konuşmada Claude'a (veya başka birine) verilip kaldığı yerden
devam edilebilmesi için hazırlandı. Yeni konuşmayı açarken bu dosyayı ve güncel
`proje.zip`'inizi birlikte yükleyin, "bu plana göre devam et" deyin.

---

## 1. Proje nedir

React + Vite + TypeScript frontend, Supabase backend (Postgres + Auth + Storage).
Kullanım eşyası/ürün **takas** platformu ("Swaloop"). Amaç: web sitesini önce
eksiksiz çalışır hale getirip sonra Capacitor ile mobil uygulamaya (App
Store/Play Store) çevirmek.

## 2. Şu ana kadar YAPILDI ve doğrulandı

Aşağıdakiler gerçekten `npm install` + `npx tsc --noEmit` + `npx vite build` ile
test edildi, hatasız derleniyor:

- **`src/lib/supabase.ts`** — client artık `createClient<Database>(...)` ile
  tipli. Önceden hiç tip kontrolü yoktu.
- **`src/services/authService.ts`** — `trust_profiles` tablosu artık gerçekten
  okunuyor (önceden her kullanıcıya sabit "score: 5, Başlangıç" gösteriliyordu).
  `bio` alanı artık gerçekten kaydediliyor (önceden formda vardı ama DB'ye
  yazılmıyordu). `dbUpdates` artık gevşek `Record<string, any>` değil, gerçek
  `TablesUpdate<'profiles'>` tipinde.
- **`src/services/listingService.ts`** — `updateData` aynı şekilde
  `TablesUpdate<'listings'>` tipine geçirildi (tip hatası düzeltildi).
- **İki migration dosyası** eklendi (`supabase/migrations/`):
  - `20260818053823_create_profiles_table.sql` — canlıda var olan `profiles`
    tablosunu geriye dönük tanımlıyor (dosya daha önce 0 byte'tı).
  - `20260818130000_sync_remote_schema_structure.sql` — canlıda var olan ama
    migration geçmişinde hiç karşılığı olmayan 13 tabloyu (yapısal olarak,
    `IF NOT EXISTS` ile güvenli) geri türetiyor.
  - **ÖNEMLİ EKSİK**: Bu iki dosyada RLS (row-level security) politikaları
    YOK — CSV dökümünde policy bilgisi yoktu, tahmin edilmedi. Gerçek RLS'i
    almak için: `supabase db pull` (kullanıcının kendi bilgisayarında,
    Supabase CLI ile projeye login olmuş halde).

## 3. Gerçek canlı veritabanı şeması (16 tablo, doğrulanmış)

`src/types/supabase.ts` (Supabase CLI ile üretilmiş, güvenilir kaynak) ve
`Supabase_Snippet_Untitled_query.csv` (foreign key + function dökümü)
üzerinden çıkarıldı:

```
categories, favorites, impact_records, listing_images, listings,
loop_participants, loops, profiles, reviews, trade_events,
trade_offer_items, trade_offers, trades, trust_events, trust_profiles
```

Not: **`messages`/`conversations` tablosu DB'de hiç yok.** Mesajlaşma
özelliği için önce yeni migration (tablo oluşturma) gerekiyor, sonra kod
entegrasyonu.

Ayrıca `public.create_trust_profile()` adında bir trigger fonksiyonu var:
`profiles` tablosuna her INSERT'te otomatik olarak `trust_profiles` satırı
açıyor. Bu zaten canlıda çalışıyor, dokunmaya gerek yok.

## 4. Özellik durumu (mevcut hâliyle)

| Özellik | Durum |
|---|---|
| Kullanıcı kaydı/giriş (telefon+OTP) | ✅ Kod hazır, ama gerçek SMS için Supabase'e Twilio/MessageBird gibi bir sağlayıcı bağlanmalı (ücretli) |
| Profil oluşturma/düzenleme, güven puanı | ✅ Hazır ve gerçek veriye bağlı |
| İlan oluşturma/listeleme/arama/favoriler/kategori | ✅ Hazır ve gerçek veriye bağlı |
| Fotoğraf "yükleme" | ⚠️ Sahte — sabit stok görsellerden seçtiriyor, gerçek Supabase Storage'a hiç yüklemiyor. Bucket da `config.toml`'da hâlâ yorum satırında |
| **Takas sistemi** (teklif/kabul/red/teslimat/tamamlanma) | ✅ Gerçek Supabase sorgularına bağlandı (bkz. §5.6) — derleme doğrulandı, **canlıda henüz test edilmedi** |
| Değerlendirme/review | ✅ Gerçek `reviews` tablosuna bağlandı (takas sistemiyle birlikte, §5.6) — canlıda henüz test edilmedi |
| Loop (döngü takas) | ❌ Tamamen mock veri (`INITIAL_LOOPS`) |
| Mesajlaşma/chat | ❌ Tamamen mock veri, **DB'de tablo bile yok** |
| Topluluk (gönderi/etkinlik/rozet) | ❌ Tamamen mock veri, rozet (badge) için DB'de tablo yok |
| Admin paneli | ❌ Mock veri + kısmen gerçek `listingService` |

## 5. Bir sonraki adım: TAKAS SİSTEMİNİ BAĞLAMA — ayrıntılı plan

### 5.1 Neden tek parça halinde yapılmalı (parçalı yapılamaz)

Foreign key zinciri: `reviews.trade_id → trades.id → trades.offer_id →
trade_offers.id`. Yani sadece "review'ları bağlayalım" gibi küçük bir adım bile
tek başına yapılamaz — mock `trade-<timestamp>` id'leri gerçek `trades`
tablosunda yok, FK constraint hatası verir. Bu yüzden tüm zincir birlikte
taşınmalı.

### 5.2 Frontend veri modeli ile DB şeması arasındaki fark (kritik)

Frontend'deki `TradeOffer` tipi (`src/types/index.ts`, satır ~132) çok daha
zengin:
- `timeline: TradeEvent[]` — 6 sabit adımlı, her adımda başlık+açıklama+durum
  metni içeren bir UI zaman çizelgesi.
- `combinedImpact: EnvironmentalImpact` — hesaplanmış çevresel etki objesi.
- `offeredListings` / `requestedListings` — tam `Listing` objeleri (id değil).

DB tarafında ise:
- `trade_offers`: sender_id, receiver_id, status, message, parent_offer_id
  (karşı teklif zinciri için).
- `trade_offer_items`: offer_id, listing_id, owner_id, **role** (muhtemelen
  `'offered'` / `'requested'` gibi bir değer — canlı DB'de bu enum/check
  constraint'i doğrulanmalı, CSV dökümünde net değildi).
- `trades`: offer_id, sender_id, receiver_id, status, delivery_method,
  delivery_notes, started_at, completed_at — teklif kabul edildikten SONRA
  oluşan ayrı bir kayıt.
- `trade_events`: trade_id, actor_id, event_type, note, created_at — serbest
  formatlı bir olay günlüğü (sabit 6 adım değil).
- `impact_records`: trade_id (unique), co2e_kg, vb. — takas tamamlanınca
  hesaplanıp buraya yazılacak.

**Önerilen yaklaşım:** UI'daki 6 adımlı `timeline`'ı DB'de olduğu gibi
saklamaya çalışmayın (UI metnini veritabanında tutmak yanlış mimari). Bunun
yerine:
1. `trade_events`'e sadece `event_type` (örn. `offer_sent`, `offer_accepted`,
   `locked`, `delivery_planned`, `delivered`, `completed`, `rejected`) ve
   `actor_id` yazın.
2. Frontend'de, DB'den gelen `status` + `trade_events` listesine bakarak
   6 adımlık `timeline` UI objesini **istemci tarafında** (bir mapping
   fonksiyonuyla) yeniden üretin — başlık/açıklama metinleri zaten
   `tradeService.ts` içinde sabit olarak duruyor, sadece hangi adımın
   `completed/in_progress/pending/failed` olduğunu event log'dan çıkarın.

### 5.3 Değiştirilmesi gereken dosyalar (bulundu, netleştirildi)

`src/services/tradeService.ts` — **tamamen yeniden yazılmalı**, tüm metodlar
`async` olmalı ve gerçek Supabase sorguları kullanmalı:
- `getAllTrades()` → kaldırılabilir ya da admin için ayrı bir sorguya
  dönüştürülebilir.
- `getTradeById(id)` → `trade_offers` + `trade_offer_items` (join) + varsa
  `trades` + `trade_events` sorgusu.
- `getUserIncomingTrades(userId)` / `getUserOutgoingTrades(userId)` →
  `trade_offers` üzerinde `receiver_id`/`sender_id` filtreli sorgu.
- `createTradeOffer(data)` → `trade_offers` insert + `trade_offer_items`
  toplu insert (offered + requested satırları, `role` alanıyla ayrılmış).
- `acceptOffer(tradeId)` → `trade_offers.status` update + yeni bir `trades`
  satırı insert + `trade_events` insert.
- `rejectOffer(tradeId, reason)` → `trade_offers.status` update + event.
- `createCounterOffer(...)` → yeni `trade_offers` satırı,
  `parent_offer_id` dolu.
- `advanceTradeStep(tradeId, step)` → `trades.status` update +
  `trade_events` insert; adım 6'da ayrıca `impact_records` insert.
- `submitReview(review)` → `reviews` insert.
- `getReviewsForUser(userId)` → `reviews` select (`reviewed_user_id` ile).

Bu dosyayı çağıran ve **async'e uyum için güncellenmesi gereken** 8 sayfa
(hepsi doğrulandı, satır numaraları mevcut koda göre):
- `src/pages/trades/MakeOfferPage.tsx` (satır 113 — `createTradeOffer`)
- `src/pages/trades/TradeDetailPage.tsx` (satır 34, 71, 80, 88, 109 —
  `getTradeById`, `acceptOffer`, `rejectOffer`, `advanceTradeStep`,
  `submitReview`)
- `src/pages/trades/TradeRequestsPage.tsx` (satır 35-37, 76, 84)
- `src/pages/trades/TradeOffersPage.tsx` (satır 15-17, 44, 52)
- `src/pages/trades/DisputePage.tsx` (satır 13 — `getTradeById`)
- `src/pages/chat/MessagesPage.tsx` (satır 188 — `getTradeById`, mesaj
  içindeki takas kartı için)
- `src/pages/profile/PublicProfilePage.tsx` (satır 18 —
  `getReviewsForUser`)
- `src/pages/profile/ProfilePage.tsx` (satır 51 — `getReviewsForUser`)

Her sayfada değişim şekli genelde aynı kalıp: `useState` + senkron çağrı yerine
`useState` + `useEffect` içinde `await` ile veri çekme, yüklenirken bir
loading state gösterme. `TradeProcessPage.tsx` ve `SwipeMatchPage.tsx` ve
`PaperclipPage.tsx` tradeService'i **dolaylı** kullanıyor gibi görünse de
grep'te doğrudan çağrı bulunamadı — yeni oturumda tekrar kontrol edilmeli.

### 5.4 Test kısıtı (önemli, yeni oturuma hatırlatma)

Bu ortamdan (Claude'un kod çalıştırma alanından) gerçek Supabase projenize
ağ erişimi YOK — sadece paket kayıt sunucularına (npm, pypi, github vb.)
erişim var. Yani yapılan değişiklikler:
- `npx tsc --noEmit` ve `npx vite build` ile **derleme/tip** doğrulaması
  yapılabilir (bu, önceki turlarda başarıyla yapıldı).
- Ama **gerçek Supabase sorgularının çalışıp çalışmadığı, RLS politikalarına
  takılıp takılmayacağı bu ortamdan test edilemez.** Kullanıcının kendi
  bilgisayarında `npm run dev` ile canlı test etmesi şart.

### 5.5 Önerilen çalışma sırası (yeni oturumda)

1. `trade_offer_items.role` kolonunun gerçek değerlerini (enum/check
   constraint) doğrulamak için kullanıcıdan Supabase Studio'dan bakmasını
   isteyin ya da `supabase db pull` çıktısını isteyin — CSV dökümünde bu net
   değildi, yanlış varsayımla insert hata verebilir.
2. `tradeService.ts`'i yukarıdaki mantıkla yeniden yazın.
3. Sayfaları tek tek async'e çevirin, her birinde `tsc --noEmit` çalıştırıp
   derleme hatasını anında yakalayın.
4. Son olarak `vite build` ile tam derleme kontrolü yapın.
5. Kullanıcıya "kendi ortamınızda test edin" diyerek net bir test listesi
   verin (teklif gönder → kabul et → teslimat adımlarını ilerlet →
   değerlendirme bırak → profilde görün).

### 5.6 YAPILDI — bu turda tamamlanan kısım

Aşağıdakiler gerçekten `npm install` + `npx tsc --noEmit` + `npx vite build`
ile test edildi, **hatasız derleniyor** (canlı Supabase'e karşı DEĞİL —
sebep için §5.4'e bakın, bu hâlâ geçerli):

- **`src/services/tradeService.ts`** — tamamen yeniden yazıldı. Artık
  `INITIAL_TRADES` mock verisi yerine gerçek sorgular kullanıyor:
  `trade_offers` + `trade_offer_items` (join, `role='offered'/'requested'`
  ile ayrılıyor) + varsa `trades` + `trade_events`. Tüm metodlar `async`.
  6 adımlı UI `timeline`'ı artık DB durumundan (offer.status / trades.status
  / trade_events) istemci tarafında hesaplanıyor — plan §5.2'de önerilen
  yaklaşımla birebir aynı.
- **`src/services/authService.ts`** — `mapProfile` fonksiyonu `export`
  edildi (tradeService içinde sender/receiver profillerini aynı mantıkla
  map'lemek için tekrar kullanılıyor, kod tekrarı önlendi).
- **`src/services/listingService.ts`** — `enrichListings` fonksiyonu
  `export` edildi (tradeService içinde offered/requested ilanları aynı
  mantıkla map'lemek için tekrar kullanılıyor).
- **8 sayfanın tamamı** async'e çevrildi (plan §5.3'te listelenen dosyalar):
  `MakeOfferPage.tsx`, `TradeDetailPage.tsx`, `TradeRequestsPage.tsx`,
  `TradeOffersPage.tsx`, `DisputePage.tsx`, `MessagesPage.tsx`,
  `PublicProfilePage.tsx`, `ProfilePage.tsx`. Hepsinde aynı kalıp
  kullanıldı: `useState` + `useEffect` içinde `await` ile veri çekme,
  yüklenirken basit bir "yükleniyor..." metni gösterme.
- **`TradeProcessPage.tsx`, `SwipeMatchPage.tsx`, `PaperclipPage.tsx`**
  — plan §5.3'te "dolaylı kullanıyor gibi görünüyor, kontrol edilmeli"
  diye not düşülmüştü. Bu turda `grep` ile doğrudan `tradeService.` çağrısı
  olmadığı doğrulandı ve `tsc`/`vite build` bu üç dosyayı da hatasız
  derledi — yani ekstra bir değişikliğe gerek yoktu.

**Yapılan mimari/veri kararları (yeni oturumda hatırlanması gereken):**

1. `trade_offer_items.role` için `'offered'` / `'requested'` string
   değerleri kullanıldı — bu hâlâ bir **varsayım** (plan §5.5 madde 1'de
   belirtilen doğrulama hâlâ yapılmadı). İlk canlı testte insert hata
   verirse, gerçek constraint/enum değerine göre `tradeService.ts`
   içindeki bu iki string güncellenmeli.
2. `trade_offers` tablosunda `expires_at` kolonu yok; frontend'in
   `expiresAt` alanı `created_at + 2 gün` olarak istemci tarafında
   hesaplanıyor. Gerçek bir DB alanı değil.
3. Teklif oluşturma sırasında kullanıcının seçtiği `deliveryMethod` /
   `deliveryDetails` şu an **hiçbir yere kaydedilmiyor** — çünkü DB
   tarafında bu alanlar `trades` tablosunda ve `trades` satırı ancak
   teklif kabul edildiğinde oluşuyor. `acceptOffer` şu an
   `delivery_method: null` ile bir `trades` satırı açıyor. Bu, ürün
   kararı gerektiren bir boşluk: teklif eden kişinin tercih ettiği
   teslimat yöntemi ya `trade_offers`'a yeni bir kolon olarak eklenip
   `acceptOffer` sırasında `trades`'e taşınmalı, ya da kabul eden
   kişiden ayrıca sorulmalı.
4. `reviews` tablosunda ayrı bir "güvenilirlik" (trustworthiness) puanı
   kolonu yok — sadece genel `rating`, `communication_rating`,
   `item_accuracy_rating`, `delivery_rating` var. Frontend'in
   `categories.trustworthiness` alanı şimdilik genel `rating` ile aynı
   değeri gösteriyor. Gerekirse `reviews` tablosuna bir
   `trustworthiness_rating` kolonu eklenip migration yazılabilir.
5. `impact_records` insert'i (`advanceTradeStep`, adım 6) kolon adlarını
   `src/types/supabase.ts`'teki tanıma göre tahmin ederek yazdı
   (`co2e_kg`, `water_liters`, `energy_kwh`, `raw_material_kg`,
   `waste_reduction_kg`). Bu kısım tip kontrolünden geçti ama **gerçek
   insert'in çalışıp çalışmadığı test edilmedi** (RLS + olası ek
   constraint'ler nedeniyle).

**Yeni oturumda ilk yapılması gereken (kullanıcı kendi ortamında test
edecek — bkz. plan §5.5 madde 5'teki test listesi hâlâ geçerli):**

1. `npm run dev` ile gerçek Supabase'e karşı uçtan uca test: teklif
   gönder → kabul et → teslimat adımlarını ilerlet → değerlendirme bırak
   → profilde görün.
2. Hata alınırsa önce yukarıdaki 1. maddedeki `role` değerini, sonra
   RLS politikalarını (plan §2'deki "ÖNEMLİ EKSİK" hâlâ geçerli — RLS
   politikaları migration'larda yok) kontrol edin.
3. Test başarılıysa §6'daki bir sonraki önceliğe (mesajlaşma) geçilebilir.

## 6. Sonraki öncelik (takas sisteminden sonra)

1. Mesajlaşma — önce `messages`/`conversations` tabloları için migration
   yazılmalı (DB'de hiç yok), sonra `messageService.ts` bağlanmalı.
2. Gerçek fotoğraf yükleme — Supabase Storage bucket açılmalı
   (`config.toml`'da `[storage.buckets.images]` etkinleştirilmeli) ve
   `CreateListingPage.tsx`'e gerçek dosya seçici + `supabase.storage.upload`
   eklenmeli.
3. Loop sistemi — `loopService.ts`, `loops`/`loop_participants` tablolarına
   bağlanmalı (takas sistemiyle benzer desende, daha basit çünkü FK zinciri
   yok).
4. Topluluk/rozet — önce badge için tablo tasarımı/migration gerekiyor.

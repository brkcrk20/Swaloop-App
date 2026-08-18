-- Döngü (Loop) özelliğini gerçek ilanlara bağlamak için gereken ek kolonlar.
--
-- Canlıda zaten var olan `loops` / `loop_participants` tabloları (bkz.
-- 20260818130000_sync_remote_schema_structure.sql) hiçbir katılımcının hangi
-- ilanı döngüye soktuğunu tutmuyordu. Frontend'deki `Loop`/`LoopParticipant`
-- tipleri her katılımcı için `offeringListing` (verdiği ürün) bekliyor;
-- `receivingListing` ve zincirdeki "kime veriyor / kimden alıyor" bilgisi ise
-- katılımcıların `joined_at` sırasına göre istemci tarafında (dairesel: i.
-- katılımcı (i+1).katılımcıya verir) hesaplanıyor, bu yüzden ayrıca bir
-- "gives_to"/"receives_from" kolonu gerekmiyor (trade sistemindeki 6 adımlı
-- timeline'ın DB'de tutulmayıp istemci tarafında hesaplanması kararıyla aynı
-- desen — bkz. swaloop-devam-plani.md §5.2).
--
-- `loops.status` canlıda `default 'active'` idi; frontend'in beklediği union
-- (`matching | locked | in_delivery | completed | cancelled`) ile uyuşmuyordu.
-- Buradan sonra uygulama satır oluştururken durumu her zaman açıkça
-- `'matching'` olarak yazacak; var olan default'a dokunmuyoruz (geriye dönük
-- kayıt yoksa zararsız, olsa bile DB tarafında zorla düzeltmek riskli olurdu).

alter table public.loops
  add column if not exists category text not null default 'other';

alter table public.loop_participants
  add column if not exists offering_listing_id uuid references public.listings(id);

comment on column public.loop_participants.offering_listing_id is
  'Bu katılımcının döngüye soktuğu ilan. NULL = henüz ilan seçmemiş / katılım tamamlanmamış.';

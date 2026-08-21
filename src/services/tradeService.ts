import { TradeOffer, TradeStatus, UserProfile, Listing, Review, TradeEvent } from '../types';
import { impactService } from './impactService';
import { supabase } from '../lib/supabase';
import { mapProfile } from './authService';
import { enrichListings } from './listingService';
import type { Json, TablesInsert } from '../types/supabase';

// ─────────────────────────────────────────────────────────────────────────
// NOT: Bu dosya artık mockData yerine gerçek Supabase sorguları kullanıyor.
//
// DB şeması ile frontend `TradeOffer` tipi arasındaki fark için
// swaloop-devam-plani.md §5.2'ye bakın. Özetle:
//  - `trade_offers`  : teklif (sender/receiver/status/message/parent_offer_id)
//  - `trade_offer_items`: teklife dahil ilanlar, `role` = 'offered' | 'requested'
//  - `trades`        : teklif KABUL EDİLİNCE oluşan ayrı kayıt (status/delivery)
//  - `trade_events`  : trades.id'ye bağlı serbest formatlı olay günlüğü
//
// VARSAYIM (doğrulanmadı — bkz. plan §5.5 madde 1):
// `trade_offer_items.role` kolonu DB'de düz `text`, CHECK/ENUM constraint'i
// CSV dökümünde görünmüyordu. Bu dosya 'offered' / 'requested' string
// değerlerini kullanıyor. Kullanıcının kendi ortamında ilk test sırasında
// insert hata verirse, gerçek constraint değerleri buraya göre güncellenmeli.
// ─────────────────────────────────────────────────────────────────────────

type TradeOfferRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  message: string | null;
  parent_offer_id: string | null;
  created_at: string;
  updated_at: string;
  sender?: any;
  receiver?: any;
  items?: TradeOfferItemRow[];
  trade?: TradeRow | TradeRow[] | null;
};

type TradeOfferItemRow = {
  id: string;
  offer_id: string;
  listing_id: string;
  owner_id: string;
  role: string;
  created_at: string;
  listing?: any;
};

type TradeRow = {
  id: string;
  offer_id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  delivery_method: string | null;
  delivery_notes: string | null;
  started_at: string;
  completed_at: string | null;
  events?: TradeEventRow[];
  reviews?: { reviewer_id: string }[];
};

type TradeEventRow = {
  id: string;
  trade_id: string;
  actor_id: string | null;
  event_type: string;
  note: string | null;
  created_at: string;
};

// Profil join'lerinde `profiles(*)` KULLANILMIYOR: o satır `phone` kolonunu da
// içeriyor ve `*` ile çekildiğinde karşı tarafın telefon numarası istemciye
// iniyordu. mapProfile() eksik alanlar için zaten güvenli varsayılanlar üretir.
const PROFILE_COLS = 'id, full_name, avatar_url, city, district, bio, created_at';

// Takas kaydı, olay günlüğü ve değerlendirmeler artık AYRI sorgularla değil,
// bu tek select içinde iç içe çekiliyor.
//
// Önceden her teklif için sırayla trades, trade_events, reviews sorguları ve
// iki ayrı enrichListings çağrısı (her biri 2 sorgu daha) yapılıyordu —
// teklif başına ~7 istek. 50 teklifli bir listede 350'den fazla ağ isteği
// demekti (bkz. denetim bulgusu D-01).
const OFFER_SELECT =
  `*, sender:profiles!trade_offers_sender_id_fkey(${PROFILE_COLS}), receiver:profiles!trade_offers_receiver_id_fkey(${PROFILE_COLS}), items:trade_offer_items(*, listing:listings(*, user:profiles(${PROFILE_COLS}), images:listing_images(storage_path))), trade:trades(*, events:trade_events(*), reviews(reviewer_id))`;

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return 'Bekleniyor';
  return new Date(iso).toLocaleDateString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function hydrateOffer(
  offerRow: TradeOfferRow,
  tradeRow: TradeRow | null,
  events: TradeEventRow[],
  listingsById: Map<string, Listing>
): TradeOffer {
  const initiator = mapProfile(offerRow.sender);
  const receiver = mapProfile(offerRow.receiver);

  const offeredItemRows = (offerRow.items ?? []).filter((i) => i.role === 'offered');
  const requestedItemRows = (offerRow.items ?? []).filter((i) => i.role === 'requested');

  // İlanlar tüm teklifler için TEK seferde zenginleştirilip haritaya
  // konuyor (bkz. hydrateOffers); burada yalnızca haritadan okunuyor.
  const pick = (rows: TradeOfferItemRow[]) =>
    rows
      .map((i) => listingsById.get(i.listing_id))
      .filter((l): l is Listing => Boolean(l));

  const offeredListings = pick(offeredItemRows);
  const requestedListings = pick(requestedItemRows);

  const reviewerIds: string[] = (tradeRow?.reviews ?? []).map((r) => r.reviewer_id);

  const combinedImpact = impactService.calculateCombinedTradeImpact([
    ...offeredListings.map((l) => l.estimatedImpact),
    ...requestedListings.map((l) => l.estimatedImpact),
  ]);

  // Frontend durumu: teklif reddedilmediyse ve henüz `trades` satırı yoksa
  // teklifin kendi durumu (offer_sent / counter_offered) geçerli; `trades`
  // satırı oluştuktan sonra asıl ilerleme onun `status`'una göre okunur.
  const status: TradeStatus = (tradeRow?.status ?? offerRow.status) as TradeStatus;

  const deliveryEvent = events.find((e) => e.event_type === 'delivery_planned');
  const verifiedEvent = events.find((e) => e.event_type === 'verified');
  const completedEvent = events.find((e) => e.event_type === 'completed');

  const step2Failed = offerRow.status === 'rejected';
  const accepted = !!tradeRow;

  const timeline: TradeEvent[] = [
    {
      id: `${offerRow.id}-step1`,
      step: 1,
      title: 'Teklif Gönderildi',
      description: `${initiator.fullName} takas teklifini iletti.`,
      timestamp: fmtDateTime(offerRow.created_at),
      actorId: initiator.id,
      actorName: initiator.fullName,
      status: 'completed',
    },
    {
      id: `${offerRow.id}-step2`,
      step: 2,
      title: 'Teklif Kabulü',
      description: step2Failed
        ? 'Teklif reddedildi.'
        : accepted
        ? `${receiver.fullName} teklifi kabul etti.`
        : 'Karşı tarafın onayı bekleniyor.',
      timestamp: step2Failed
        ? fmtDateTime(offerRow.updated_at)
        : accepted
        ? fmtDateTime(tradeRow!.started_at)
        : 'Bekleniyor',
      actorId: receiver.id,
      actorName: receiver.fullName,
      status: step2Failed ? 'failed' : accepted ? 'completed' : 'pending',
    },
    {
      id: `${offerRow.id}-step3`,
      step: 3,
      title: 'Ürünler Kilitlendi',
      description: accepted
        ? 'Ürünler diğer kullanıcılara kilitlendi.'
        : 'Takas onaylandığında ürünler kilitlenecek.',
      timestamp: accepted ? fmtDateTime(tradeRow!.started_at) : 'Bekleniyor',
      actorId: 'system',
      actorName: 'Swaloop Sistemi',
      status: step2Failed ? 'failed' : accepted ? 'completed' : 'pending',
    },
    {
      id: `${offerRow.id}-step4`,
      step: 4,
      title: 'Teslimat & Buluşma',
      description: 'Teslimat aşaması.',
      timestamp: fmtDateTime(deliveryEvent?.created_at ?? (accepted ? tradeRow!.started_at : null)),
      actorId: 'both',
      actorName: 'Her İki Taraf',
      status: !accepted
        ? 'pending'
        : status === 'verified' || status === 'completed'
        ? 'completed'
        : 'in_progress',
    },
    {
      id: `${offerRow.id}-step5`,
      step: 5,
      title: 'Karşılıklı Onay',
      description: 'Ürünlerin teslim alındığının doğrulanması.',
      timestamp: fmtDateTime(verifiedEvent?.created_at ?? null),
      actorId: 'both',
      actorName: 'Her İki Taraf',
      status:
        status === 'verified' || status === 'completed' ? 'completed' : 'pending',
    },
    {
      id: `${offerRow.id}-step6`,
      step: 6,
      title: 'Takas Tamamlandı',
      description:
        status === 'completed'
          ? `Takas başarıyla tamamlandı. Toplam +${combinedImpact.co2eKg} kg CO₂e tasarrufu sağlandı.`
          : 'SVS Çevresel etki hesaplaması ve profil güncellemesi.',
      timestamp: fmtDateTime(completedEvent?.created_at ?? tradeRow?.completed_at ?? null),
      actorId: 'system',
      actorName: 'Swaloop Sistemi',
      status: status === 'completed' ? 'completed' : 'pending',
    },
  ];

  return {
    id: offerRow.id,
    initiatorId: offerRow.sender_id,
    initiator,
    receiverId: offerRow.receiver_id,
    receiver,
    offeredListingIds: offeredListings.map((l) => l.id),
    offeredListings,
    requestedListingIds: requestedListings.map((l) => l.id),
    requestedListings,
    note: offerRow.message ?? undefined,
    deliveryMethod: (tradeRow?.delivery_method as TradeOffer['deliveryMethod']) ?? 'in_person',
    deliveryDetails: tradeRow?.delivery_notes
      ? { notes: tradeRow.delivery_notes }
      : undefined,
    status,
    createdAt: offerRow.created_at,
    // DB'de `trade_offers` için bir expires_at kolonu yok; UI'da gösterim
    // amaçlı, oluşturulma + 2 gün olarak hesaplanıyor (gerçek bir DB alanı
    // değil, gelecekte migration ile eklenebilir).
    expiresAt: new Date(
      new Date(offerRow.created_at).getTime() + 2 * 24 * 60 * 60 * 1000
    ).toISOString(),
    updatedAt: offerRow.updated_at,
    counterOfferFromId: offerRow.parent_offer_id ?? undefined,
    timeline,
    combinedImpact,
    // Değerlendirme bayrakları artık ayrı bir sorgu gerektirmiyor: reviewer
    // kimlikleri OFFER_SELECT içinde trades altına gömülü geliyor.
    isReviewedByInitiator: tradeRow
      ? reviewerIds.includes(offerRow.sender_id)
      : undefined,
    isReviewedByReceiver: tradeRow
      ? reviewerIds.includes(offerRow.receiver_id)
      : undefined,
  };
}

/**
 * Bir teklife gömülü gelen `trades` ilişkisini tek satıra indirger.
 * PostgREST, tekil ilişkileri sürüme göre dizi ya da nesne olarak
 * döndürebildiği için iki şekle de hazırlıklı davranıyoruz.
 */
function pickTradeRow(offerRow: TradeOfferRow): TradeRow | null {
  const raw = offerRow.trade;
  if (!raw) return null;
  return Array.isArray(raw) ? raw[0] ?? null : raw;
}

/**
 * Bir teklife bağlı takas kaydının kimliğini getirir.
 * Yalnızca submitReview için gerekli: reviews.trade_id, teklif kimliğini
 * değil takas kimliğini bekliyor.
 */
async function fetchTradeIdByOfferId(offerId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('trades')
    .select('id')
    .eq('offer_id', offerId)
    .maybeSingle();

  if (error) {
    console.error('Trade kaydı alınamadı:', error);
    return null;
  }

  return data?.id ?? null;
}

/**
 * Teklif satırlarını tek seferde TradeOffer nesnelerine dönüştürür.
 *
 * Kritik nokta: içerdeki TÜM ilanlar tek bir enrichListings() çağrısıyla
 * zenginleştiriliyor. Önceki sürümde bu, teklif başına iki kez çağrılıyor ve
 * her çağrı kategori + güven puanı için ayrı sorgular açıyordu.
 */
async function hydrateOffers(offerRows: TradeOfferRow[]): Promise<TradeOffer[]> {
  if (!offerRows.length) return [];

  const listingRows: any[] = [];
  const seen = new Set<string>();

  for (const offer of offerRows) {
    for (const item of offer.items ?? []) {
      if (item.listing && !seen.has(item.listing_id)) {
        seen.add(item.listing_id);
        listingRows.push(item.listing);
      }
    }
  }

  const listings = await enrichListings(listingRows);
  const listingsById = new Map(listings.map((l) => [l.id, l]));

  return offerRows.map((offerRow) => {
    const tradeRow = pickTradeRow(offerRow);
    const events = (tradeRow?.events ?? [])
      .slice()
      .sort((a, b) => a.created_at.localeCompare(b.created_at));

    return hydrateOffer(offerRow, tradeRow, events, listingsById);
  });
}

export const tradeService = {
  /** Admin/genel bakış amaçlı. Sayfalıdır; varsayılan sayfa boyutu 50. */
  async getAllTrades(options?: { page?: number; pageSize?: number }): Promise<TradeOffer[]> {
    const page = options?.page ?? 0;
    const size = options?.pageSize ?? 50;

    const { data, error } = await supabase
      .from('trade_offers')
      .select(OFFER_SELECT)
      .order('created_at', { ascending: false })
      .range(page * size, page * size + size - 1);

    if (error || !data) {
      console.error('Takas teklifleri alınamadı:', error);
      return [];
    }

    return hydrateOffers(data as any[]);
  },

  async getTradeById(id: string): Promise<TradeOffer | undefined> {
    const { data, error } = await supabase
      .from('trade_offers')
      .select(OFFER_SELECT)
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      console.error('Takas teklifi alınamadı:', error);
      return undefined;
    }

    const [offer] = await hydrateOffers([data as any]);
    return offer;
  },

  async getUserIncomingTrades(userId: string): Promise<TradeOffer[]> {
    const { data, error } = await supabase
      .from('trade_offers')
      .select(OFFER_SELECT)
      .eq('receiver_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('Gelen teklifler alınamadı:', error);
      return [];
    }

    return hydrateOffers(data as any[]);
  },

  async getUserOutgoingTrades(userId: string): Promise<TradeOffer[]> {
    const { data, error } = await supabase
      .from('trade_offers')
      .select(OFFER_SELECT)
      .eq('sender_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('Giden teklifler alınamadı:', error);
      return [];
    }

    return hydrateOffers(data as any[]);
  },

  async createTradeOffer(data: {
    initiator: UserProfile;
    receiver: UserProfile;
    offeredListings: Listing[];
    requestedListings: Listing[];
    note?: string;
    deliveryMethod: 'in_person' | 'cargo' | 'safe_point';
    deliveryDetails?: {
      scheduledDate?: string;
      locationName?: string;
      notes?: string;
    };
    parentOfferId?: string;
  }): Promise<TradeOffer | undefined> {
    // Teklif + kalemleri artık tek bir transaction içinde, veritabanı
    // tarafında oluşturuluyor. Önceden bunlar iki ayrı istemci INSERT'iydi;
    // ikincisi başarısız olursa yetim bir teklif satırı kalıyordu (elle
    // silmeye çalışılıyordu ama o silme de başarısız olabilirdi).
    //
    // RPC ayrıca istemcinin yapamadığı doğrulamayı yapıyor: teklif edilen
    // ilanlar gerçekten gönderene, istenen ilanlar gerçekten alıcıya ait mi?
    const { data: offerId, error } = await supabase.rpc('create_trade_offer', {
      p_receiver_id: data.receiver.id,
      p_offered_listing_ids: data.offeredListings.map((l) => l.id),
      p_requested_listing_ids: data.requestedListings.map((l) => l.id),
      p_message: data.note ?? null,
      p_delivery_method: data.deliveryMethod,
      p_parent_offer_id: data.parentOfferId ?? null,
    });

    if (error || !offerId) {
      console.error('Teklif oluşturulamadı:', error);
      return undefined;
    }

    return this.getTradeById(offerId as string);
  },

  async acceptOffer(tradeId: string): Promise<TradeOffer | undefined> {
    // Yetki kontrolü ve atomiklik veritabanına taşındı:
    //  · Teklifi yalnızca ALICISI kabul edebilir (önceden hiç kontrol yoktu,
    //    teklif kimliğini bilen herkes başkasının takasını kabul edebiliyordu).
    //  · Teklif güncellemesi + trades satırı + olay kaydı tek transaction.
    //    Önceden ikinci adım patlarsa teklif "kabul edildi ama takası yok"
    //    durumunda kilitleniyordu.
    const { error } = await supabase.rpc('accept_trade_offer', {
      p_offer_id: tradeId,
    });

    if (error) {
      console.error('Teklif kabul edilemedi:', error);
      return undefined;
    }

    return this.getTradeById(tradeId);
  },

  async rejectOffer(tradeId: string, reason?: string): Promise<TradeOffer | undefined> {
    // Gerekçe artık `message` kolonuna DEĞİL, `rejection_reason` kolonuna
    // yazılıyor — önceden teklifi gönderenin orijinal notunun üzerine
    // yazılıyor ve o not kalıcı olarak kayboluyordu.
    const { error } = await supabase.rpc('reject_trade_offer', {
      p_offer_id: tradeId,
      p_reason: reason ?? null,
    });

    if (error) {
      console.error('Teklif reddedilemedi:', error);
      return undefined;
    }

    return this.getTradeById(tradeId);
  },

  async createCounterOffer(
    originalTradeId: string,
    newOfferedListings: Listing[],
    newRequestedListings: Listing[],
    newDeliveryMethod: 'in_person' | 'cargo' | 'safe_point',
    note?: string
  ): Promise<TradeOffer | undefined> {
    const orig = await this.getTradeById(originalTradeId);
    if (!orig) return undefined;

    // Orijinal teklifin durumunu değiştirmek yetki gerektiriyor: bunu yalnızca
    // teklifin alıcısı yapabilir. Önceden istemciden doğrudan UPDATE
    // atılıyordu, yani teklifin tarafı olmayan biri de başkasının teklifini
    // 'counter_offered' durumuna taşıyabiliyordu.
    const { error: markError } = await supabase.rpc('mark_offer_countered', {
      p_original_offer_id: originalTradeId,
    });

    if (markError) {
      console.error('Karşı teklif verilemedi:', markError);
      return undefined;
    }

    // parent_offer_id artık teklif oluşturulurken atanıyor; önceden teklif
    // oluşturulduktan SONRA ikinci bir UPDATE ile bağlanıyordu ve o update
    // başarısız olursa karşı teklif orijinaline hiç bağlanmıyordu.
    const counterOffer = await this.createTradeOffer({
      initiator: orig.receiver,
      receiver: orig.initiator,
      offeredListings: newOfferedListings,
      requestedListings: newRequestedListings,
      deliveryMethod: newDeliveryMethod,
      note: note || `Karşı teklif: ${orig.offeredListings[0]?.title ?? ''} yerine alternatif öneri.`,
      parentOfferId: originalTradeId,
    });

    if (!counterOffer) return undefined;

    return counterOffer;
  },

  async advanceTradeStep(tradeId: string, targetStep: 4 | 5 | 6): Promise<TradeOffer | undefined> {
    // Adım ilerletme artık RPC üzerinden. Kazanımlar:
    //  · Yalnızca takasın iki tarafından biri ilerletebilir (önceden hiç
    //    kontrol yoktu).
    //  · Adımlar atlanamaz ve geri alınamaz; durum sırası DB'de doğrulanıyor.
    //  · Durum güncellemesi, olay kaydı ve etki kaydı tek transaction.
    //  · trade_events.actor_id artık dolduruluyor (önceden 4/5/6. adımlarda
    //    boş kalıyordu, yani "kim ilerletti" bilgisi kayboluyordu).
    //
    // Etki değerleri istemcide impactService (LCA katsayı tablosu) ile
    // hesaplanıp gönderiliyor; katsayı tablosunu SQL'e kopyalamamak için.
    let impact: Json | null = null;

    if (targetStep === 6) {
      const offer = await this.getTradeById(tradeId);
      impact = offer ? ({ ...offer.combinedImpact } as unknown as Json) : null;
    }

    const { error } = await supabase.rpc('advance_trade', {
      p_offer_id: tradeId,
      p_target_step: targetStep,
      p_impact: impact,
    });

    if (error) {
      console.error('Takas adımı ilerletilemedi:', error);
      return undefined;
    }

    return this.getTradeById(tradeId);
  },

  /**
   * Kabul edilmiş ama tamamlanmamış bir takası iptal eder ve kilitli ürünleri
   * yeniden dolaşıma açar. Bu yol olmadan ilan kilitleme eklenemezdi: yarım
   * kalan her takasın ürünleri kalıcı olarak dolaşımdan çıkardı.
   */
  async cancelTrade(tradeId: string, reason?: string): Promise<TradeOffer | undefined> {
    const { error } = await supabase.rpc('cancel_trade', {
      p_offer_id: tradeId,
      p_reason: reason ?? null,
    });

    if (error) {
      console.error('Takas iptal edilemedi:', error);
      return undefined;
    }

    return this.getTradeById(tradeId);
  },

  async submitReview(review: Omit<Review, 'id' | 'createdAt'>): Promise<Review | undefined> {
    const tradeId = await fetchTradeIdByOfferId(review.tradeId);
    if (!tradeId) {
      console.error('submitReview: bu teklife bağlı bir trade kaydı yok.');
      return undefined;
    }

    const insertPayload: TablesInsert<'reviews'> = {
      trade_id: tradeId,
      reviewer_id: review.authorId,
      reviewed_user_id: review.targetUserId,
      rating: review.overallRating,
      communication_rating: review.categories.communication,
      item_accuracy_rating: review.categories.itemAccuracy,
      delivery_rating: review.categories.delivery,
      comment: review.comment,
    };

    const { data, error } = await supabase
      .from('reviews')
      .insert(insertPayload)
      .select()
      .single();

    if (error || !data) {
      console.error('Değerlendirme kaydedilemedi:', error);
      return undefined;
    }

    return {
      id: data.id,
      tradeId: review.tradeId,
      authorId: review.authorId,
      authorName: review.authorName,
      authorAvatar: review.authorAvatar,
      targetUserId: review.targetUserId,
      overallRating: data.rating,
      categories: {
        // DB'de ayrı bir "güvenilirlik" (trustworthiness) kolonu yok;
        // genel puan (rating) ile aynı değer kullanılıyor. Gerekirse
        // reviews tablosuna trustworthiness_rating kolonu eklenmeli.
        trustworthiness: data.rating,
        communication: data.communication_rating ?? review.categories.communication,
        itemAccuracy: data.item_accuracy_rating ?? review.categories.itemAccuracy,
        delivery: data.delivery_rating ?? review.categories.delivery,
      },
      comment: data.comment ?? '',
      createdAt: data.created_at,
    };
  },

  async getReviewsForUser(userId: string): Promise<Review[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select(`*, reviewer:profiles!reviews_reviewer_id_fkey(${PROFILE_COLS})`)
      .eq('reviewed_user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('Değerlendirmeler alınamadı:', error);
      return [];
    }

    return data.map((row: any) => ({
      id: row.id,
      tradeId: row.trade_id,
      authorId: row.reviewer_id,
      authorName: row.reviewer?.full_name ?? 'Swaloop Kullanıcısı',
      authorAvatar: row.reviewer?.avatar_url ?? '',
      targetUserId: row.reviewed_user_id,
      overallRating: row.rating,
      categories: {
        trustworthiness: row.rating,
        communication: row.communication_rating ?? row.rating,
        itemAccuracy: row.item_accuracy_rating ?? row.rating,
        delivery: row.delivery_rating ?? row.rating,
      },
      comment: row.comment ?? '',
      createdAt: row.created_at,
    }));
  },
};

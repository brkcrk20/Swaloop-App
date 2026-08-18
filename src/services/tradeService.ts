import { TradeOffer, TradeStatus, UserProfile, Listing, Review, TradeEvent } from '../types';
import { impactService } from './impactService';
import { supabase } from '../lib/supabase';
import { mapProfile } from './authService';
import { enrichListings } from './listingService';
import type { TablesInsert, TablesUpdate } from '../types/supabase';

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
};

type TradeEventRow = {
  id: string;
  trade_id: string;
  actor_id: string | null;
  event_type: string;
  note: string | null;
  created_at: string;
};

const OFFER_SELECT =
  '*, sender:profiles!trade_offers_sender_id_fkey(*), receiver:profiles!trade_offers_receiver_id_fkey(*), items:trade_offer_items(*, listing:listings(*, user:profiles(*), images:listing_images(storage_path)))';

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return 'Bekleniyor';
  return new Date(iso).toLocaleDateString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function hydrateOffer(
  offerRow: TradeOfferRow,
  tradeRow: TradeRow | null,
  events: TradeEventRow[]
): Promise<TradeOffer> {
  const initiator = mapProfile(offerRow.sender);
  const receiver = mapProfile(offerRow.receiver);

  const offeredItemRows = (offerRow.items ?? []).filter((i) => i.role === 'offered');
  const requestedItemRows = (offerRow.items ?? []).filter((i) => i.role === 'requested');

  const offeredListings = await enrichListings(
    offeredItemRows.map((i) => i.listing).filter(Boolean)
  );
  const requestedListings = await enrichListings(
    requestedItemRows.map((i) => i.listing).filter(Boolean)
  );

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
    // DB tarafında review'ların hangi teklife ait olduğunu görmek için ayrı
    // bir sorgu gerekiyor; bu iki alan getTradeById içinde ayrıca dolduruluyor.
    isReviewedByInitiator: undefined,
    isReviewedByReceiver: undefined,
  };
}

async function fetchTradeRowByOfferId(offerId: string): Promise<TradeRow | null> {
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('offer_id', offerId)
    .maybeSingle();

  if (error) {
    console.error('Trade kaydı alınamadı:', error);
    return null;
  }
  return data as TradeRow | null;
}

async function fetchEventsForTrade(tradeId: string | undefined): Promise<TradeEventRow[]> {
  if (!tradeId) return [];
  const { data, error } = await supabase
    .from('trade_events')
    .select('*')
    .eq('trade_id', tradeId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Trade eventleri alınamadı:', error);
    return [];
  }
  return (data ?? []) as TradeEventRow[];
}

async function attachReviewFlags(
  offer: TradeOffer,
  tradeId: string | undefined
): Promise<TradeOffer> {
  if (!tradeId) return offer;

  const { data, error } = await supabase
    .from('reviews')
    .select('reviewer_id')
    .eq('trade_id', tradeId);

  if (error || !data) return offer;

  return {
    ...offer,
    isReviewedByInitiator: data.some((r) => r.reviewer_id === offer.initiatorId),
    isReviewedByReceiver: data.some((r) => r.reviewer_id === offer.receiverId),
  };
}

async function fullyHydrate(offerRow: TradeOfferRow): Promise<TradeOffer> {
  const tradeRow = await fetchTradeRowByOfferId(offerRow.id);
  const events = await fetchEventsForTrade(tradeRow?.id);
  const offer = await hydrateOffer(offerRow, tradeRow, events);
  return attachReviewFlags(offer, tradeRow?.id);
}

export const tradeService = {
  /**
   * Admin/genel bakış amaçlı. Büyük veri setlerinde sayfalama eklenmeli.
   */
  async getAllTrades(): Promise<TradeOffer[]> {
    const { data, error } = await supabase
      .from('trade_offers')
      .select(OFFER_SELECT)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('Takas teklifleri alınamadı:', error);
      return [];
    }

    return Promise.all(data.map((row: any) => fullyHydrate(row)));
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

    return fullyHydrate(data as any);
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

    return Promise.all(data.map((row: any) => fullyHydrate(row)));
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

    return Promise.all(data.map((row: any) => fullyHydrate(row)));
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
  }): Promise<TradeOffer | undefined> {
    const insertPayload: TablesInsert<'trade_offers'> = {
      sender_id: data.initiator.id,
      receiver_id: data.receiver.id,
      status: 'offer_sent',
      message: data.note ?? null,
    };

    const { data: offerRow, error: offerError } = await supabase
      .from('trade_offers')
      .insert(insertPayload)
      .select()
      .single();

    if (offerError || !offerRow) {
      console.error('Teklif oluşturulamadı:', offerError);
      return undefined;
    }

    const itemRows: TablesInsert<'trade_offer_items'>[] = [
      ...data.offeredListings.map((l) => ({
        offer_id: offerRow.id,
        listing_id: l.id,
        owner_id: data.initiator.id,
        role: 'offered',
      })),
      ...data.requestedListings.map((l) => ({
        offer_id: offerRow.id,
        listing_id: l.id,
        owner_id: data.receiver.id,
        role: 'requested',
      })),
    ];

    const { error: itemsError } = await supabase
      .from('trade_offer_items')
      .insert(itemRows);

    if (itemsError) {
      console.error('Teklif kalemleri oluşturulamadı:', itemsError);
      // Teklif satırı yetim kalmasın diye geri alınıyor.
      await supabase.from('trade_offers').delete().eq('id', offerRow.id);
      return undefined;
    }

    // NOT: deliveryMethod/deliveryDetails burada henüz kaydedilmiyor —
    // DB'de bu bilgiler `trades` tablosunda tutuluyor ve `trades` satırı
    // ancak teklif KABUL EDİLİNCE (acceptOffer) oluşuyor. Kullanıcının
    // teklif ekranında seçtiği teslimat tercihi şimdilik hiçbir yere
    // kaydedilmiyor; ileride ya `trade_offers`'a bir kolon eklenip
    // taşınmalı ya da acceptOffer sırasında receiver'ın teslimat
    // tercihiyle birleştirilmeli. Bu, yeni oturumda netleştirilmesi
    // gereken bir karar.

    return this.getTradeById(offerRow.id);
  },

  async acceptOffer(tradeId: string): Promise<TradeOffer | undefined> {
    const { data: offerRow, error: offerError } = await supabase
      .from('trade_offers')
      .select('*')
      .eq('id', tradeId)
      .maybeSingle();

    if (offerError || !offerRow) {
      console.error('Teklif bulunamadı:', offerError);
      return undefined;
    }

    const { error: updateError } = await supabase
      .from('trade_offers')
      .update({ status: 'accepted' })
      .eq('id', tradeId);

    if (updateError) {
      console.error('Teklif durumu güncellenemedi:', updateError);
      return undefined;
    }

    const tradeInsert: TablesInsert<'trades'> = {
      offer_id: offerRow.id,
      sender_id: offerRow.sender_id,
      receiver_id: offerRow.receiver_id,
      status: 'locked',
    };

    const { data: tradeRow, error: tradeError } = await supabase
      .from('trades')
      .insert(tradeInsert)
      .select()
      .single();

    if (tradeError || !tradeRow) {
      console.error('Trade kaydı oluşturulamadı:', tradeError);
      return undefined;
    }

    await supabase.from('trade_events').insert({
      trade_id: tradeRow.id,
      actor_id: offerRow.receiver_id,
      event_type: 'offer_accepted',
      note: 'Teklif kabul edildi, ürünler kilitlendi.',
    } as TablesInsert<'trade_events'>);

    return this.getTradeById(tradeId);
  },

  async rejectOffer(tradeId: string, reason?: string): Promise<TradeOffer | undefined> {
    const { error } = await supabase
      .from('trade_offers')
      .update({ status: 'rejected', message: reason })
      .eq('id', tradeId);

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

    await supabase
      .from('trade_offers')
      .update({ status: 'counter_offered' })
      .eq('id', originalTradeId);

    const counterOffer = await this.createTradeOffer({
      initiator: orig.receiver,
      receiver: orig.initiator,
      offeredListings: newOfferedListings,
      requestedListings: newRequestedListings,
      deliveryMethod: newDeliveryMethod,
      note: note || `Karşı teklif: ${orig.offeredListings[0]?.title ?? ''} yerine alternatif öneri.`,
    });

    if (!counterOffer) return undefined;

    await supabase
      .from('trade_offers')
      .update({ parent_offer_id: originalTradeId })
      .eq('id', counterOffer.id);

    return this.getTradeById(counterOffer.id);
  },

  async advanceTradeStep(tradeId: string, targetStep: 4 | 5 | 6): Promise<TradeOffer | undefined> {
    const tradeRow = await fetchTradeRowByOfferId(tradeId);
    if (!tradeRow) {
      console.error('advanceTradeStep: bu teklife bağlı bir trade kaydı yok.');
      return undefined;
    }

    let newStatus: string;
    let eventType: string;
    const update: TablesUpdate<'trades'> = {};

    if (targetStep === 4) {
      newStatus = 'delivery_planned';
      eventType = 'delivery_planned';
    } else if (targetStep === 5) {
      newStatus = 'verified';
      eventType = 'verified';
    } else {
      newStatus = 'completed';
      eventType = 'completed';
      update.completed_at = new Date().toISOString();
    }

    update.status = newStatus;

    const { error: updateError } = await supabase
      .from('trades')
      .update(update)
      .eq('id', tradeRow.id);

    if (updateError) {
      console.error('Trade durumu güncellenemedi:', updateError);
      return undefined;
    }

    await supabase.from('trade_events').insert({
      trade_id: tradeRow.id,
      event_type: eventType,
    } as TablesInsert<'trade_events'>);

    if (targetStep === 6) {
      const offer = await this.getTradeById(tradeId);
      if (offer) {
        // DÜZELTİLDİ (6. tur): src/types/supabase.ts'teki gerçek şemaya göre
        // kolon adları `material_kg` / `waste_kg` (önceden yanlışlıkla
        // `raw_material_kg` / `waste_reduction_kg` kullanılıyordu — bu, `as
        // TablesInsert<'impact_records'>` cast'i tip kontrolünü bastırdığı
        // için tsc tarafından hiç yakalanmamıştı, gerçek DB'de "column does
        // not exist" hatası verirdi).
        const impactInsert: TablesInsert<'impact_records'> = {
          trade_id: tradeRow.id,
          co2e_kg: offer.combinedImpact.co2eKg,
          water_liters: offer.combinedImpact.waterLiters,
          energy_kwh: offer.combinedImpact.energyKwh,
          material_kg: offer.combinedImpact.rawMaterialKg,
          waste_kg: offer.combinedImpact.wasteReductionKg,
          reuse_count: offer.combinedImpact.reuseCount,
          methodology_version: offer.combinedImpact.methodologyVersion,
        };

        const { error: impactError } = await supabase
          .from('impact_records')
          .insert(impactInsert);

        if (impactError) {
          console.error('Etki kaydı oluşturulamadı:', impactError);
        }
      }
    }

    return this.getTradeById(tradeId);
  },

  async submitReview(review: Omit<Review, 'id' | 'createdAt'>): Promise<Review | undefined> {
    const tradeRow = await fetchTradeRowByOfferId(review.tradeId);
    if (!tradeRow) {
      console.error('submitReview: bu teklife bağlı bir trade kaydı yok.');
      return undefined;
    }

    const insertPayload: TablesInsert<'reviews'> = {
      trade_id: tradeRow.id,
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
      .select('*, reviewer:profiles!reviews_reviewer_id_fkey(*)')
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

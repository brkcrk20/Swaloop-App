import { TradeOffer, TradeStatus, UserProfile, Listing, Review } from '../types';
import { INITIAL_TRADES } from '../data/mockData';
import { impactService } from './impactService';

let tradesStore: TradeOffer[] = [...INITIAL_TRADES];
let reviewsStore: Review[] = [];

export const tradeService = {
  getAllTrades(): TradeOffer[] {
    return [...tradesStore];
  },

  getTradeById(id: string): TradeOffer | undefined {
    return tradesStore.find((t) => t.id === id);
  },

  getUserIncomingTrades(userId: string): TradeOffer[] {
    return tradesStore.filter((t) => t.receiverId === userId);
  },

  getUserOutgoingTrades(userId: string): TradeOffer[] {
    return tradesStore.filter((t) => t.initiatorId === userId);
  },

  createTradeOffer(data: {
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
  }): TradeOffer {
    const combinedImpact = impactService.calculateCombinedTradeImpact([
      ...data.offeredListings.map((l) => l.estimatedImpact),
      ...data.requestedListings.map((l) => l.estimatedImpact),
    ]);

    const newTrade: TradeOffer = {
      id: `trade-${Date.now()}`,
      initiatorId: data.initiator.id,
      initiator: data.initiator,
      receiverId: data.receiver.id,
      receiver: data.receiver,
      offeredListingIds: data.offeredListings.map((l) => l.id),
      offeredListings: data.offeredListings,
      requestedListingIds: data.requestedListings.map((l) => l.id),
      requestedListings: data.requestedListings,
      note: data.note,
      deliveryMethod: data.deliveryMethod,
      deliveryDetails: data.deliveryDetails,
      status: 'offer_sent',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      combinedImpact,
      timeline: [
        {
          id: `evt-${Date.now()}-1`,
          step: 1,
          title: 'Teklif Gönderildi',
          description: `${data.initiator.fullName} takas teklifini iletti.`,
          timestamp: new Date().toLocaleDateString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          actorId: data.initiator.id,
          actorName: data.initiator.fullName,
          status: 'completed',
        },
        {
          id: `evt-${Date.now()}-2`,
          step: 2,
          title: 'Teklif Kabulü',
          description: 'Karşı tarafın onayı bekleniyor.',
          timestamp: 'Bekleniyor',
          actorId: data.receiver.id,
          actorName: data.receiver.fullName,
          status: 'pending',
        },
        {
          id: `evt-${Date.now()}-3`,
          step: 3,
          title: 'Ürünler Kilitlendi',
          description: 'Takas onaylandığında ürünler kilitlenecek.',
          timestamp: 'Bekleniyor',
          actorId: 'system',
          actorName: 'Swaloop Sistemi',
          status: 'pending',
        },
        {
          id: `evt-${Date.now()}-4`,
          step: 4,
          title: 'Teslimat & Buluşma',
          description: 'Teslimat aşaması.',
          timestamp: 'Bekleniyor',
          actorId: 'both',
          actorName: 'Her İki Taraf',
          status: 'pending',
        },
        {
          id: `evt-${Date.now()}-5`,
          step: 5,
          title: 'Karşılıklı Onay',
          description: 'Ürünlerin teslim alındığının doğrulanması.',
          timestamp: 'Bekleniyor',
          actorId: 'both',
          actorName: 'Her İki Taraf',
          status: 'pending',
        },
        {
          id: `evt-${Date.now()}-6`,
          step: 6,
          title: 'Takas Tamamlandı',
          description: 'SVS Çevresel etki hesaplaması ve profil güncellemesi.',
          timestamp: 'Bekleniyor',
          actorId: 'system',
          actorName: 'Swaloop Sistemi',
          status: 'pending',
        },
      ],
    };

    tradesStore = [newTrade, ...tradesStore];
    return newTrade;
  },

  acceptOffer(tradeId: string): TradeOffer | undefined {
    const trade = tradesStore.find((t) => t.id === tradeId);
    if (!trade) return undefined;

    trade.status = 'locked'; // Advance to locked step 3
    trade.updatedAt = new Date().toISOString();

    // Update timeline
    const nowTime = new Date().toLocaleDateString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    if (trade.timeline[1]) {
      trade.timeline[1].status = 'completed';
      trade.timeline[1].timestamp = nowTime;
      trade.timeline[1].description = `${trade.receiver.fullName} teklifi kabul etti.`;
    }
    if (trade.timeline[2]) {
      trade.timeline[2].status = 'completed';
      trade.timeline[2].timestamp = nowTime;
      trade.timeline[2].description = 'Ürünler diğer kullanıcılara kilitlendi.';
    }
    if (trade.timeline[3]) {
      trade.timeline[3].status = 'in_progress';
      trade.timeline[3].description = 'Teslimat planı bekleniyor / yürütülüyor.';
    }

    return trade;
  },

  rejectOffer(tradeId: string, reason?: string): TradeOffer | undefined {
    const trade = tradesStore.find((t) => t.id === tradeId);
    if (!trade) return undefined;

    trade.status = 'rejected';
    trade.updatedAt = new Date().toISOString();
    if (trade.timeline[1]) {
      trade.timeline[1].status = 'failed';
      trade.timeline[1].description = reason || 'Teklif reddedildi.';
    }
    return trade;
  },

  createCounterOffer(
    originalTradeId: string,
    newOfferedListings: Listing[],
    newRequestedListings: Listing[],
    newDeliveryMethod: 'in_person' | 'cargo' | 'safe_point',
    note?: string
  ): TradeOffer | undefined {
    const orig = tradesStore.find((t) => t.id === originalTradeId);
    if (!orig) return undefined;

    orig.status = 'counter_offered';

    // The counter offer swaps initiator and receiver or updates current
    const counterOffer = this.createTradeOffer({
      initiator: orig.receiver,
      receiver: orig.initiator,
      offeredListings: newOfferedListings,
      requestedListings: newRequestedListings,
      deliveryMethod: newDeliveryMethod,
      note: note || `Karşı teklif: ${orig.offeredListings[0]?.title} yerine alternatif öneri.`,
    });

    counterOffer.counterOfferFromId = originalTradeId;
    return counterOffer;
  },

  advanceTradeStep(tradeId: string, targetStep: 4 | 5 | 6): TradeOffer | undefined {
    const trade = tradesStore.find((t) => t.id === tradeId);
    if (!trade) return undefined;

    const nowTime = new Date().toLocaleDateString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    if (targetStep === 4) {
      trade.status = 'delivery_planned';
      if (trade.timeline[3]) {
        trade.timeline[3].status = 'in_progress';
        trade.timeline[3].timestamp = nowTime;
      }
    } else if (targetStep === 5) {
      trade.status = 'verified';
      if (trade.timeline[3]) trade.timeline[3].status = 'completed';
      if (trade.timeline[4]) {
        trade.timeline[4].status = 'completed';
        trade.timeline[4].timestamp = nowTime;
      }
    } else if (targetStep === 6) {
      trade.status = 'completed';
      if (trade.timeline[4]) trade.timeline[4].status = 'completed';
      if (trade.timeline[5]) {
        trade.timeline[5].status = 'completed';
        trade.timeline[5].timestamp = nowTime;
        trade.timeline[5].description = `Takas başarıyla tamamlandı. Toplam +${trade.combinedImpact.co2eKg} kg CO₂e tasarrufu sağlandı.`;
      }
    }

    trade.updatedAt = new Date().toISOString();
    return trade;
  },

  submitReview(review: Omit<Review, 'id' | 'createdAt'>): Review {
    const newRev: Review = {
      ...review,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    reviewsStore.push(newRev);

    const trade = tradesStore.find((t) => t.id === review.tradeId);
    if (trade) {
      if (trade.initiatorId === review.authorId) {
        trade.isReviewedByInitiator = true;
      } else {
        trade.isReviewedByReceiver = true;
      }
    }

    return newRev;
  },

  getReviewsForUser(userId: string): Review[] {
    return reviewsStore.filter((r) => r.targetUserId === userId);
  },
};

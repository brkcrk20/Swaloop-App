export type ListingCondition = 'zero' | 'like_new' | 'very_good' | 'good' | 'acceptable';
export type ProductCondition = ListingCondition;

// NOT: Bu id'ler artık doğrudan canlı Supabase `categories` tablosundaki
// `slug` sütunuyla birebir aynı (bkz. swaloop-devam-plani.md §7). Önceden
// burada Türkçe id'ler vardı (`elektronik`, `ev_yasam`, `arac_parca`,
// `kitap_muzik`, `bebek_cocuk`, `diger`) ama DB'deki gerçek slug'lar
// İngilizce ve farklı bir kategori kümesiydi (`arac_parca`/`kitap_muzik`/
// `bebek_cocuk` DB'de hiç yok; DB'de ayrıca `photography`/`collectibles`
// var ama frontend'de hiç yoktu). İlan oluşturma bu yüzden "Geçersiz
// kategori" hatası veriyordu — bkz. `listingService.ts` `getCategoryUuid`.
// Artık id = DB slug olduğu için ayrı bir çeviri katmanına gerek yok.
export type CategoryId =
  | 'electronics'
  | 'home-living'
  | 'sports'
  | 'fashion'
  | 'hobby'
  | 'books'
  | 'music'
  | 'photography'
  | 'collectibles'
  | 'other';

export interface Category {
  id: CategoryId;
  name: string;
  iconName: string;
  color: string;
  itemCount: number;
  avgCo2Savings: number; // in kg
  avgWaterSavings: number; // in Liters
}

export interface UserProfile {
  id: string;
  phone: string; // Masked: +90 5XX XXX XX XX
  fullName: string;
  avatarUrl: string;
  city: string;
  district: string;
  memberSince: string;
  bio?: string;
  interests: CategoryId[];
  wantedCategories: CategoryId[];
  /**
   * Yetki seviyesi (public.profiles.role). Yönetim paneline erişimi belirler.
   * Asıl kontrol veritabanındaki RLS politikalarında (public.is_admin());
   * buradaki değer yalnızca arayüzü gizlemek için kullanılır.
   */
  role: 'user' | 'moderator' | 'admin';
  isVerified: boolean;
  trustProfile: TrustProfile;
  stats: {
    totalTrades: number;
    activeListings: number;
    completedLoops: number;
    totalCo2Prevented: number; // kg
    totalWaterSaved: number; // Liters
    totalEnergySaved: number; // kWh
    totalRawMaterialsSaved: number; // kg
    totalItemsReused: number;
    responseRatePercent: number;
    avgResponseTimeMinutes: number;
    cancellationRatePercent: number;
  };
}

export interface TrustProfile {
  score: number; // 0.00 to 5.00
  level: 'Başlangıç' | 'Güvenilir' | 'Çok Güvenilir' | 'Topluluk Lideri' | 'Güvenilir Üye' | 'Doğrulanmış Üye';
  phoneVerified: boolean;
  idVerified: boolean;
  successfulTradesCount: number;
  cancellationRate: number; // e.g. 0.02 = 2%
  responseRate: number; // e.g. 0.98 = 98%
  averageRating: number;
  reviewCount: number;
  reportCount: number;
  accountAgeDays: number;
  positiveHighlights: string[];
}

export interface EnvironmentalImpact {
  co2eKg: number;
  waterLiters: number;
  energyKwh: number;
  rawMaterialKg: number;
  wasteReductionKg: number;
  reuseCount: number;
  methodologyVersion: string;
}

export interface Listing {
  id: string;
  userId: string;
  user: {
    id: string;
    fullName: string;
    avatarUrl: string;
    trustScore: number;
    city: string;
    district: string;
    isVerified: boolean;
    /** Alınan değerlendirme sayısı. 0 ise puan gösterilmemeli. */
    reviewCount: number;
    /** Ortalama değerlendirme puanı; hiç değerlendirme yoksa 0. */
    averageRating: number;
    /** Tamamlanmış takas sayısı. */
    completedTrades: number;
  };
  title: string;
  description: string;
  categoryId: CategoryId;
  condition: ListingCondition;
  images: string[];
  location: {
    city: string;
    district: string;
    distanceKm: number;
    safeMeetingPoint?: string;
    lat?: number;
    lng?: number;
  };
  lookingFor: string; // What the user wants in exchange
  deliveryOptions: ('in_person' | 'cargo' | 'safe_point')[];
  estimatedImpact: EnvironmentalImpact;
  status: 'active' | 'in_trade' | 'traded' | 'paused' | 'removed';
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  favoriteCount: number;
  interestedUsersCount?: number;
  isFavorite?: boolean;
  tags: string[];
}

export type TradeStatus =
  | 'offer_sent'
  | 'offer_received'
  | 'counter_offered'
  | 'accepted'
  | 'locked'
  | 'delivery_planned'
  | 'shipped'
  | 'received'
  | 'verified'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'expired'
  | 'disputed';

export interface TradeOffer {
  id: string;
  initiatorId: string;
  initiator: UserProfile;
  receiverId: string;
  receiver: UserProfile;
  offeredListingIds: string[];
  offeredListings: Listing[];
  requestedListingIds: string[];
  requestedListings: Listing[];
  note?: string;
  deliveryMethod: 'in_person' | 'cargo' | 'safe_point';
  deliveryDetails?: {
    scheduledDate?: string;
    locationName?: string;
    trackingCode?: string;
    notes?: string;
  };
  status: TradeStatus;
  createdAt: string;
  expiresAt: string;
  updatedAt: string;
  counterOfferFromId?: string;
  timeline: TradeEvent[];
  combinedImpact: EnvironmentalImpact;
  isReviewedByInitiator?: boolean;
  isReviewedByReceiver?: boolean;
}

export interface TradeEvent {
  id: string;
  step: 1 | 2 | 3 | 4 | 5 | 6; // 1: Teklif, 2: Kabul, 3: Kilitlendi, 4: Teslimat, 5: Onay, 6: Tamamlandı
  title: string;
  description: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  type: 'text' | 'trade_card' | 'counter_card' | 'delivery_card' | 'system_card';
  tradeOfferId?: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participant: UserProfile;
  lastMessage: Message;
  unreadCount: number;
  updatedAt: string;
  relatedListing?: Listing;
  activeTradeId?: string;
}

export interface Review {
  id: string;
  tradeId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  targetUserId: string;
  overallRating: number; // 1-5
  categories: {
    trustworthiness: number;
    communication: number;
    itemAccuracy: number;
    delivery: number;
  };
  comment: string;
  createdAt: string;
}

export interface LoopParticipant {
  userId: string;
  user: UserProfile;
  offeringListing: Listing;
  receivingListing: Listing;
  givesToUserId: string;
  receivesFromUserId: string;
  hasConfirmed: boolean;
  status: 'pending' | 'confirmed' | 'delivered' | 'completed';
}

export interface Loop {
  id: string;
  title: string;
  category: CategoryId;
  totalParticipants: number;
  participants: LoopParticipant[];
  status: 'matching' | 'locked' | 'in_delivery' | 'completed' | 'cancelled';
  totalImpact: EnvironmentalImpact;
  createdAt: string;
  completedAt?: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  iconName: string;
  category: 'trade' | 'eco' | 'community' | 'trust';
  isEarned: boolean;
  earnedDate?: string;
  progressPercent: number;
  maxProgress: number;
  currentProgress: number;
}

export interface PaperclipStage {
  stageNumber: number;
  itemTitle: string;
  category: string;
  image: string;
  estimatedImpact: number; // kg co2e
  dateCompleted?: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

export interface MysterySwapItem {
  id: string;
  title: string;
  category: CategoryId;
  hint: string;
  image: string;
  estimatedCo2e: number;
  ownerName: string;
  ownerTrustScore: number;
  location: string;
}

export interface CommunityPost {
  id: string;
  author: UserProfile;
  title: string;
  content: string;
  images?: string[];
  tradeStory?: {
    itemGiven: string;
    itemReceived: string;
    co2Saved: number;
  };
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  createdAt: string;
  tags: string[];
}

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  city: string;
  district: string;
  locationName: string;
  addressDetails: string;
  date: string;
  time: string;
  attendeesCount: number;
  isAttending?: boolean;
  organizer: string;
  imageUrl: string;
  category: 'swap_party' | 'eco_workshop' | 'repair_cafe' | 'meetup';
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'trade_offer' | 'trade_status' | 'message' | 'loop' | 'badge' | 'system';
  title: string;
  message: string;
  linkUrl: string;
  isRead: boolean;
  createdAt: string;
  thumbnail?: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: 'user' | 'listing' | 'trade' | 'message';
  targetId: string;
  targetTitle: string;
  reason: 'fraud' | 'inappropriate' | 'no_response' | 'broken_item' | 'fake_account' | 'other';
  description: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  evidenceImages?: string[];
  createdAt: string;
  resolutionNote?: string;
}

export interface Dispute {
  id: string;
  tradeId: string;
  initiator: UserProfile;
  respondent: UserProfile;
  initiatorItem: Listing;
  respondentItem: Listing;
  reason: string;
  status: 'open' | 'under_review' | 'resolved_return' | 'resolved_cancel' | 'dismissed';
  evidencePhotos: string[];
  adminDecision?: string;
  createdAt: string;
}

export interface AdminKPI {
  totalUsers: number;
  activeUsers: number;
  totalListings: number;
  activeTrades: number;
  completedTrades: number;
  activeLoops: number;
  totalSvsImpactCo2Kg: number;
  totalWaterSavedL: number;
  totalEnergyKwh: number;
  pendingReports: number;
  userGrowthPercent: number;
  tradeGrowthPercent: number;
}

export interface AdminAuditLog {
  id: string;
  adminName: string;
  action: string;
  target: string;
  timestamp: string;
  ipAddress: string;
  details: string;
}

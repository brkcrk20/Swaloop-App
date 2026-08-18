import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { listingService } from '../../services/listingService';
import { ImpactCard } from '../../components/common/ImpactCard';
import { TrustCard } from '../../components/common/TrustCard';
import { Listing } from '../../types';
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Clock,
  ShieldCheck,
  MessageSquare,
  Repeat,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useApp();

  const [listing, setListing] = useState<Listing | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');

  useEffect(() => {
    setIsLoading(true);
    listingService.getListingById(id || '').then((data) => {
      setListing(data);
      setIsLoading(false);
    });
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-700 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-stone-900 mb-2">İlan Bulunamadı</h2>
        <p className="text-xs text-stone-500 mb-4">Bu ilan yayından kaldırılmış veya silinmiş olabilir.</p>
        <button
          type="button"
          onClick={() => navigate('/kesfet')}
          className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold"
        >
          Keşfet'e Dön
        </button>
      </div>
    );
  }

  const handleFavoriteToggle = async () => {
    const isFav = await listingService.toggleFavorite(listing.id);
    showToast(isFav ? 'Favorilere Eklendi' : 'Favorilerden Çıkarıldı', listing.title, 'info');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: listing.title,
        text: `Swaloop'ta takas ilanı: ${listing.title}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Bağlantı Kopyalandı', 'İlan linki panoya kopyalandı.', 'success');
    }
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowReportModal(false);
    showToast('Şikayetiniz Alındı', 'Moderatörlerimiz ilanı inceleyecek.', 'info');
  };

  const getConditionText = (c: typeof listing.condition) => {
    switch (c) {
      case 'zero':
        return 'Sıfır / Kutusu Açılmamış';
      case 'like_new':
        return 'Sıfır Gibi (Kusursuz)';
      case 'very_good':
        return 'Çok İyi Durumda';
      case 'good':
        return 'İyi / Kullanım İzi Var';
      case 'acceptable':
        return 'Makul / Çalışır Durumda';
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-28 text-stone-900">
      {/* Top Floating Action Bar */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-200/80 px-4 py-2.5">
        <div className="max-w-md md:max-w-2xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl bg-white border border-stone-200 text-stone-700 flex items-center justify-center hover:bg-stone-100 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="w-10 h-10 rounded-2xl bg-white border border-stone-200 text-stone-700 flex items-center justify-center hover:bg-stone-100 transition-colors shadow-xs"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleFavoriteToggle}
              className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-colors shadow-xs ${
                listing.isFavorite
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}
            >
              <Heart className={`w-4 h-4 ${listing.isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md md:max-w-2xl mx-auto px-4 pt-3 space-y-4">
        {/* Photo Gallery */}
        <div className="space-y-2">
          <div className="relative aspect-4/3 w-full rounded-3xl overflow-hidden bg-stone-900 shadow-md">
            <img
              src={listing.images[activeImageIndex] || listing.images[0]}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-stone-950/70 text-white text-xs font-semibold backdrop-blur-sm">
              {activeImageIndex + 1} / {listing.images.length}
            </div>
          </div>

          {/* Thumbnails */}
          {listing.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {listing.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    activeImageIndex === idx
                      ? 'border-emerald-600 scale-105 shadow-xs'
                      : 'border-transparent opacity-70'
                  }`}
                >
                  <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Interested Users Social Proof Bar */}
        {listing.interestedUsersCount && listing.interestedUsersCount > 0 && (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>{listing.interestedUsersCount} kişi</strong> bu ürünle ilgileniyor ve takas
                düşünüyor.
              </span>
            </div>
          </div>
        )}

        {/* Title, Location & Status */}
        <div className="bg-white rounded-3xl p-5 border border-stone-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-semibold">
              {getConditionText(listing.condition)}
            </span>
            <span className="flex items-center gap-1 text-xs text-stone-500 font-medium">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              {listing.location.district}, {listing.location.city} ({listing.location.distanceKm} km)
            </span>
          </div>

          <h1 className="text-xl font-bold text-stone-900 font-display">{listing.title}</h1>

          {/* Wanted Item Callout */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 flex items-start gap-2.5">
            <Repeat className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                Takasta Aranan Ürün / Kategori
              </span>
              <p className="text-xs font-semibold mt-0.5">{listing.lookingFor}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
              Ürün Açıklaması
            </h3>
            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-line">
              {listing.description}
            </p>
          </div>

          {/* Delivery Methods */}
          <div className="pt-2 border-t border-stone-100 flex flex-wrap gap-2 text-xs">
            {listing.deliveryOptions.map((opt) => (
              <span
                key={opt}
                className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 font-medium flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {opt === 'in_person' && 'Elden Güvenli Buluşma'}
                {opt === 'cargo' && 'Kargo ile Gönderim'}
                {opt === 'safe_point' && 'Güvenli Takas Noktası'}
              </span>
            ))}
          </div>
        </div>

        {/* SVS Environmental Impact Detailed Card */}
        <ImpactCard impact={listing.estimatedImpact} variant="detailed" />

        {/* Owner Profile & Explainable Trust Card */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">İlan Sahibi</h3>
          <div className="p-4 rounded-3xl bg-white border border-stone-200 flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <img
                src={listing.user.avatarUrl}
                alt={listing.user.fullName}
                className="w-12 h-12 rounded-full object-cover border border-stone-200"
              />
              <div>
                <h4 className="text-sm font-bold text-stone-900">{listing.user.fullName}</h4>
                <p className="text-xs text-stone-500">{listing.user.city} • Doğrulanmış Üye</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/mesajlar/chat-1')}
              className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-xs font-semibold text-stone-700"
            >
              Mesaj Yaz
            </button>
          </div>

          <TrustCard
            trustProfile={{
              score: listing.user.trustScore,
              level: listing.user.trustScore >= 4.7 ? 'Güvenilir Üye' : 'Doğrulanmış Üye',
              phoneVerified: true,
              idVerified: false,
              successfulTradesCount: 14,
              cancellationRate: 0.02,
              responseRate: 0.98,
              averageRating: listing.user.trustScore,
              reviewCount: 14,
              reportCount: 0,
              accountAgeDays: 180,
              positiveHighlights: [
                'Zamanında Teslim',
                'Ürün Açıklamayla Uyumlu',
                'Hızlı İletişim',
              ],
            }}
            userName={listing.user.fullName}
          />
        </div>

        {/* Report Listing Button */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-rose-600 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Bu ilanı şikayet et</span>
          </button>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      {/* Floating Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200/90 dark:border-stone-800 p-3 pb-safe shadow-xl">
        <div className="max-w-md md:max-w-2xl mx-auto flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate(`/mesajlar/chat-1`)}
            className="flex-1 py-3 sm:py-3.5 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span>Mesaj Gönder</span>
          </button>
          <button
            type="button"
            onClick={() => navigate(`/teklif-olustur/${listing.id}`)}
            className="flex-1 py-3 sm:py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-950/20 flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Repeat className="w-4 h-4 stroke-[2.5] shrink-0" />
            <span>Takas Teklifi Yap</span>
          </button>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-stone-200 space-y-4">
            <h3 className="text-base font-bold text-stone-900">İlanı Şikayet Et</h3>
            <p className="text-xs text-stone-500">
              Swaloop güvenli takas kurallarına aykırı veya yanıltıcı bir durum mu var?
            </p>
            <form onSubmit={handleReportSubmit} className="space-y-3">
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-xs font-medium"
              >
                <option value="">Şikayet Nedeni Seçin</option>
                <option value="para_istedi">Nakit para talep etti (Yasak)</option>
                <option value="yaniltici_urun">Yanıltıcı ürün / Sahte bilgi</option>
                <option value="uygunsuz_icerik">Uygunsuz içerik veya fotoğraf</option>
                <option value="diger">Diğer</option>
              </select>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-xs font-semibold"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                >
                  Gönder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

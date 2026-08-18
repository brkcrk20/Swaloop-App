import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { tradeService } from '../../services/tradeService';
import { messageService } from '../../services/messageService';
import { TradeOffer } from '../../types';
import { Timeline } from '../../components/common/Timeline';
import { ImpactCard } from '../../components/common/ImpactCard';
import { SvsExplanationModal } from '../../components/common/SvsExplanationModal';
import {
  ArrowLeft,
  MessageSquare,
  ShieldCheck,
  Leaf,
  Droplets,
  Zap,
  MapPin,
  Calendar,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Star,
  Sparkles,
  ArrowLeftRight,
  Share2,
  Lock,
  Flag,
} from 'lucide-react';

export const TradeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, showToast } = useApp();

  const [trade, setTrade] = useState<TradeOffer | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [showSvsModal, setShowSvsModal] = useState(false);
  const [counterNote, setCounterNote] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewCategories, setReviewCategories] = useState({
    trustworthiness: 5,
    communication: 5,
    itemAccuracy: 5,
    delivery: 5,
  });

  const loadTrade = useCallback(async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const t = await tradeService.getTradeById(id);
    setTrade(t);
    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    loadTrade();
  }, [loadTrade]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 p-6 flex items-center justify-center">
        <p className="text-sm text-stone-500">Takas yükleniyor...</p>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="min-h-screen bg-stone-50 p-6 flex flex-col items-center justify-center text-center">
        <h2 className="text-base font-bold text-stone-800 mb-2">Takas bulunamadı</h2>
        <button
          type="button"
          onClick={() => navigate('/takaslarim')}
          className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold"
        >
          Takaslarıma Dön
        </button>
      </div>
    );
  }

  const isInitiator = trade.initiatorId === currentUser.id;
  const isReceiver = trade.receiverId === currentUser.id;
  const otherUser = isInitiator ? trade.receiver : trade.initiator;

  const myItem = isInitiator ? trade.offeredListings[0] : trade.requestedListings[0];
  const otherItem = isInitiator ? trade.requestedListings[0] : trade.offeredListings[0];

  const handleAccept = async () => {
    const updated = await tradeService.acceptOffer(trade.id);
    if (updated) {
      setTrade(updated);
      showToast('Takas Teklifi Kabul Edildi!', 'Ürünler takas için kilitlendi.', 'success');
      navigate(`/takas-sureci/${trade.id}`);
    }
  };

  const handleReject = async () => {
    const updated = await tradeService.rejectOffer(trade.id);
    if (updated) {
      setTrade(updated);
      showToast('Teklif Reddedildi', undefined, 'info');
    }
  };

  const handleAdvanceStep = async (step: 4 | 5 | 6) => {
    const updated = await tradeService.advanceTradeStep(trade.id, step);
    if (updated) {
      setTrade(updated);
      if (step === 4) {
        showToast('Teslimat Aşamasına Geçildi', 'Kargo veya buluşma planı aktif.', 'info');
      } else if (step === 5) {
        showToast('Teslimat Onaylandı!', 'Karşı taraf onayladığında takas başarıyla tamamlanacak.', 'success');
      } else if (step === 6) {
        showToast('Tebrikler! Takas Tamamlandı 🎉', `Toplam +${updated.combinedImpact.co2eKg} kg CO₂e tasarrufu sağlandı!`, 'success');
        setShowReviewModal(true);
      }
    }
  };

  const handleChatOpen = () => {
    const conv = messageService.getOrCreateConversationWithUser(otherUser.id);
    navigate(`/mesajlar/${conv.id}`);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    await tradeService.submitReview({
      tradeId: trade.id,
      authorId: currentUser.id,
      authorName: currentUser.fullName,
      authorAvatar: currentUser.avatarUrl,
      targetUserId: otherUser.id,
      overallRating: rating,
      categories: reviewCategories,
      comment: reviewComment || 'Harika ve güvenilir bir takas deneyimi oldu!',
    });

    showToast('Değerlendirmeniz Kaydedildi!', 'Topluluk güven skoruna katkınız için teşekkürler.', 'success');
    setShowReviewModal(false);
    loadTrade();
  };

  const isReviewedByMe = isInitiator ? trade.isReviewedByInitiator : trade.isReviewedByReceiver;

  return (
    <div className="min-h-screen bg-stone-50 pb-28 text-stone-900">
      <div className="max-w-md md:max-w-2xl mx-auto px-4 pt-3 space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/takaslarim')}
              className="p-2 rounded-xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-stone-900">Takas Süreci</h1>
                {trade.status === 'locked' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    <Lock className="w-3 h-3" />
                    Kilitlendi
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500">ID: #{trade.id.slice(-6)}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/dispute?tradeId=${trade.id}`)}
            className="text-stone-400 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition-colors"
            title="Sorun Bildir"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>

        {/* Counterpart Profile Card */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={otherUser.avatarUrl}
              alt={otherUser.fullName}
              className="w-12 h-12 rounded-full object-cover border border-stone-200"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-stone-900">{otherUser.fullName}</span>
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  {otherUser.trustProfile?.score ? otherUser.trustProfile.score.toFixed(1) : '4.8'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                <MapPin className="w-3 h-3 text-stone-400" />
                <span>{otherUser.district}, {otherUser.city}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleChatOpen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 hover:bg-emerald-100 text-xs font-bold border border-emerald-200 transition-colors cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Mesajlaş</span>
          </button>
        </div>

        {/* 6-Step Visual Timeline Component */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4">
          <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-3">
            6 Adımlı Takas Akışı
          </h2>
          <Timeline timeline={trade.timeline} currentStatus={trade.status} />
        </div>

        {/* Side-by-side Product Comparison */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4 space-y-3">
          <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Takaslanan Ürünler</h2>

          <div className="grid grid-cols-2 gap-3 relative items-stretch">
            {/* Left: My Item */}
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                  {isInitiator ? 'Senin Verdiğin' : 'Senin Alacağın'}
                </span>
                <div className="aspect-square rounded-lg overflow-hidden bg-stone-200 mb-2">
                  <img
                    src={myItem?.images[0]}
                    alt={myItem?.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xs font-bold text-stone-900 line-clamp-1">{myItem?.title}</h3>
                <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
                  +{myItem?.estimatedImpact.co2eKg} kg CO₂e
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-stone-200/60 text-[10px] text-stone-500">
                Durum: <span className="font-semibold text-stone-700">{myItem?.condition}</span>
              </div>
            </div>

            {/* Center Swap Arrow */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-stone-300 shadow-sm flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4 text-emerald-800" />
            </div>

            {/* Right: Other Item */}
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                  {isInitiator ? 'Senin Alacağın' : 'Senin Verdiğin'}
                </span>
                <div className="aspect-square rounded-lg overflow-hidden bg-stone-200 mb-2">
                  <img
                    src={otherItem?.images[0]}
                    alt={otherItem?.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xs font-bold text-stone-900 line-clamp-1">{otherItem?.title}</h3>
                <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
                  +{otherItem?.estimatedImpact.co2eKg} kg CO₂e
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-stone-200/60 text-[10px] text-stone-500">
                Durum: <span className="font-semibold text-stone-700">{otherItem?.condition}</span>
              </div>
            </div>
          </div>

          {/* Trade Note if any */}
          {trade.note && (
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-700">
              <span className="font-bold text-stone-500 block text-[10px] uppercase mb-0.5">Teklif Notu:</span>
              "{trade.note}"
            </div>
          )}
        </div>

        {/* Combined SVS Ecological Impact Card */}
        <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-950 text-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-emerald-300" />
              <h3 className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
                Ortak SVS Çevresel Kazanç
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowSvsModal(true)}
              className="text-[10px] text-emerald-200 underline font-semibold cursor-pointer"
            >
              Metodoloji?
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
              <span className="text-[10px] text-emerald-200/80 block">Karbon</span>
              <span className="text-base font-extrabold text-white">+{trade.combinedImpact.co2eKg} kg</span>
              <span className="text-[9px] text-emerald-300 block">CO₂e Önleme</span>
            </div>
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
              <span className="text-[10px] text-cyan-200/80 block">Sanal Su</span>
              <span className="text-base font-extrabold text-white">+{trade.combinedImpact.waterLiters} L</span>
              <span className="text-[9px] text-cyan-300 block">Tasarruf</span>
            </div>
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
              <span className="text-[10px] text-amber-200/80 block">Enerji</span>
              <span className="text-base font-extrabold text-white">+{trade.combinedImpact.energyKwh} kWh</span>
              <span className="text-[9px] text-amber-300 block">Tasarruf</span>
            </div>
          </div>
        </div>

        {/* Meeting & Delivery Protocol Details */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4 space-y-2.5">
          <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Teslimat & Güvenlik Bilgisi</h2>
          <div className="flex items-start gap-2.5 text-xs text-stone-700">
            <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Buluşma / Teslim Yeri:</span>
              <span>{trade.deliveryDetails?.locationName || 'Kadıköy Güvenli Takas Noktası (Metro Çıkışı)'}</span>
            </div>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-stone-700">
            <Calendar className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Planlanan Tarih:</span>
              <span>{trade.deliveryDetails?.scheduledDate || 'Belirlenmedi (Sohbet üzerinden kararlaştırılabilir)'}</span>
            </div>
          </div>
        </div>

        {/* Action Panel for Current Trade Status */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4 space-y-3">
          <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Sıradaki Eylem</h2>

          {/* If waiting for receiver response */}
          {trade.status === 'offer_sent' && isReceiver && (
            <div className="space-y-2">
              <p className="text-xs text-stone-600">Bu takas teklifini kabul etmek istiyor musunuz?</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleReject}
                  className="py-2.5 px-4 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 text-xs font-bold transition-colors cursor-pointer"
                >
                  Reddet
                </button>
                <button
                  type="button"
                  onClick={handleAccept}
                  className="py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Teklifi Kabul Et
                </button>
              </div>
            </div>
          )}

          {trade.status === 'offer_sent' && isInitiator && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
              Teklifiniz karşı tarafa iletildi. Karşı taraf onayladığında bildirim alacaksınız.
            </div>
          )}

          {/* Locked state: Need delivery planning */}
          {trade.status === 'locked' && (
            <div className="space-y-2">
              <p className="text-xs text-stone-600">
                Ürünler kilitlendi! Karşı tarafla sohbet üzerinden buluşma saati ayarlayın veya teslimatı başlatın.
              </p>
              <button
                type="button"
                onClick={() => handleAdvanceStep(4)}
                className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Teslimat Planını Onayla & Başlat
              </button>
            </div>
          )}

          {/* Delivery Planned state: In transit */}
          {trade.status === 'delivery_planned' && (
            <div className="space-y-2">
              <p className="text-xs text-stone-600">
                Buluşma veya kargo teslimatı gerçekleştiğinde aşağıdaki butona basarak ürünü teslim aldığınızı onaylayın.
              </p>
              <button
                type="button"
                onClick={() => handleAdvanceStep(5)}
                className="w-full py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Ürünü Teslim Aldım & Doğruladım</span>
              </button>
            </div>
          )}

          {/* Verified state: Complete trade */}
          {trade.status === 'verified' && (
            <div className="space-y-2">
              <p className="text-xs text-stone-600">
                Teslimat doğrulaması yapıldı. Takas sürecini tamamlayıp SVS puanınızı hesabınıza ekleyin.
              </p>
              <button
                type="button"
                onClick={() => handleAdvanceStep(6)}
                className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Takası Başarıyla Tamamla</span>
              </button>
            </div>
          )}

          {/* Completed state: Review counterpart */}
          {trade.status === 'completed' && (
            <div className="space-y-2">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Takas başarıyla tamamlandı! Çevresel kazanç profilinize yansıtıldı.</span>
              </div>
              {!isReviewedByMe ? (
                <button
                  type="button"
                  onClick={() => setShowReviewModal(true)}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Star className="w-4 h-4 fill-white" />
                  <span>Kullanıcıyı Değerlendir ({otherUser.fullName})</span>
                </button>
              ) : (
                <p className="text-[11px] text-stone-500 text-center font-medium">
                  Bu takas için değerlendirmeniz kaydedilmiştir.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2">
                <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
              </div>
              <h3 className="text-sm font-bold text-stone-900">Takas Değerlendirmesi</h3>
              <p className="text-xs text-stone-500">{otherUser.fullName} ile olan deneyiminizi puanlayın</p>
            </div>

            {/* Stars */}
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 cursor-pointer hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Sub-ratings */}
            <div className="space-y-2 text-xs bg-stone-50 p-3 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-stone-600">Ürün Açıklamaya Uygunluk:</span>
                <span className="font-bold text-amber-600">5/5</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-600">İletişim & Nezaket:</span>
                <span className="font-bold text-amber-600">5/5</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-600">Zamanında Teslimat:</span>
                <span className="font-bold text-amber-600">5/5</span>
              </div>
            </div>

            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Yorumunuz (İsteğe bağlı)..."
              rows={2}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-hidden focus:bg-white focus:border-emerald-700"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-bold text-xs"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleSubmitReview}
                className="flex-1 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs"
              >
                Puanı Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SVS Explanation Modal */}
      {showSvsModal && <SvsExplanationModal onClose={() => setShowSvsModal(false)} />}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, useAuthUser } from '../../context/AppContext';
import { tradeService } from '../../services/tradeService';
import { listingService } from '../../services/listingService';
import { TradeCard } from '../../components/common/TradeCard';
import { TradeOffer, Listing } from '../../types';
import {
  Inbox,
  Send,
  CheckCircle2,
  Sparkles,
  Flame,
  Plus,
  Repeat,
  ShieldCheck,
  ArrowRight,
  Filter,
  MessageSquare,
  Clock,
  Check,
  X,
  Layers,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

export const TradeRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const currentUser = useAuthUser();

  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing' | 'smart_matches' | 'active_process'>('incoming');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [isLoadingTrades, setIsLoadingTrades] = useState(true);
  const [incomingTrades, setIncomingTrades] = useState<TradeOffer[]>([]);
  const [outgoingTrades, setOutgoingTrades] = useState<TradeOffer[]>([]);
  const [activeProcessTrades, setActiveProcessTrades] = useState<TradeOffer[]>([]);

  const loadTrades = React.useCallback(async () => {
    setIsLoadingTrades(true);
    const [allTrades, incoming, outgoing] = await Promise.all([
      tradeService.getAllTrades(),
      tradeService.getUserIncomingTrades(currentUser.id),
      tradeService.getUserOutgoingTrades(currentUser.id),
    ]);

    setIncomingTrades(incoming);
    setOutgoingTrades(outgoing);
    setActiveProcessTrades(
      allTrades.filter(
        (t) =>
          (t.initiatorId === currentUser.id || t.receiverId === currentUser.id) &&
          (t.status === 'accepted' ||
            t.status === 'locked' ||
            t.status === 'delivery_planned' ||
            t.status === 'shipped' ||
            t.status === 'received' ||
            t.status === 'verified')
      )
    );
    setIsLoadingTrades(false);
  }, [currentUser.id]);

  useEffect(() => {
    loadTrades();
  }, [loadTrades]);

  const activeIncoming = incomingTrades.filter(
    (t) => t.status === 'offer_sent' || t.status === 'offer_received' || t.status === 'counter_offered'
  );
  const activeOutgoing = outgoingTrades.filter(
    (t) => t.status === 'offer_sent' || t.status === 'offer_received' || t.status === 'counter_offered'
  );

  // Smart matches generated from user listings vs catalog
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [otherListings, setOtherListings] = useState<Listing[]>([]);

  useEffect(() => {
    listingService.getUserListings(currentUser.id).then(setUserListings);
    listingService
      .getAllListings()
      .then((all) => setOtherListings(all.filter((l) => l.user.id !== currentUser.id)));
  }, [currentUser.id]);

  const smartMatches = otherListings.slice(0, 4).map((target, idx) => ({
    id: `smart-${target.id}`,
    targetListing: target,
    myListing: userListings[0] || otherListings[1],
    matchPercentage: 96 - idx * 4,
    reason: `${target.user.fullName} "${target.lookingFor}" arıyor, senin eşyaların ile tam uyumlu!`,
  }));

  const handleAccept = async (tradeId: string) => {
    const updated = await tradeService.acceptOffer(tradeId);
    if (updated) {
      showToast('Teklif Kabul Edildi!', 'Ürünler takas için kilitlendi. 6 adımlı süreç başladı.', 'success');
      navigate(`/takas-sureci/${tradeId}`);
    }
  };

  const handleReject = async (tradeId: string) => {
    const updated = await tradeService.rejectOffer(tradeId);
    if (updated) {
      showToast('Teklif Reddedildi', 'Takas isteği geri çevrildi.', 'info');
      loadTrades();
    }
  };

  if (isLoadingTrades) {
    return (
      <div className="min-h-screen bg-stone-50 pb-24 text-stone-900 flex items-center justify-center">
        <p className="text-sm text-stone-500">Takas istekleri yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-24 text-stone-900">
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 pt-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-stone-900 tracking-tight font-display">
              Takas İstekleri & Eşleşmeler
            </h1>
            <p className="text-xs text-stone-500">
              Gelen teklifleri yönetin ve eşleşen takas fırsatlarını değerlendirin
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/eslesme')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-emerald-700 hover:from-amber-600 hover:to-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-900/20 transition-all cursor-pointer"
          >
            <Flame className="w-4 h-4 fill-white" />
            <span>Kaydır & Eşleş</span>
          </button>
        </div>

        {/* Swipe Matching Promo Banner */}
        <div
          onClick={() => navigate('/eslesme')}
          className="p-4 rounded-3xl bg-gradient-to-br from-stone-900 via-stone-800 to-emerald-950 text-white border border-emerald-500/30 shadow-md cursor-pointer hover:border-emerald-400 transition-all relative overflow-hidden flex items-center justify-between gap-3 group"
        >
          <div className="space-y-1 relative z-10">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Hızlı Takas Eşleştirme
            </span>
            <h2 className="text-base font-extrabold text-white">
              Kaydırarak Takas Eşleştirmesi Yap 🔥
            </h2>
            <p className="text-xs text-stone-300 max-w-sm">
              Aradığın eşyaları tek tek incele, beğendiklerinle anında karşılıklı eşleşme yakala.
            </p>
          </div>

          <div className="w-11 h-11 rounded-2xl bg-emerald-800/80 border border-emerald-400/40 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>

        {/* 4 Status KPI Tab Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Gelen İstekler */}
          <div
            onClick={() => setActiveTab('incoming')}
            className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'incoming'
                ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                : 'bg-white text-stone-700 border-stone-200/90 hover:bg-stone-50'
            }`}
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className={`text-[9.5px] font-bold uppercase tracking-wider truncate ${activeTab === 'incoming' ? 'text-emerald-200' : 'text-stone-400'}`}>
                Gelen İstekler
              </span>
              <Inbox className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'incoming' ? 'text-emerald-300' : 'text-emerald-700'}`} />
            </div>
            <div className="text-lg sm:text-xl font-black">{activeIncoming.length}</div>
            <div className={`text-[9.5px] truncate ${activeTab === 'incoming' ? 'text-emerald-100' : 'text-stone-500'}`}>
              Karar bekleyen
            </div>
          </div>

          {/* Giden İstekler */}
          <div
            onClick={() => setActiveTab('outgoing')}
            className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'outgoing'
                ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                : 'bg-white text-stone-700 border-stone-200/90 hover:bg-stone-50'
            }`}
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className={`text-[9.5px] font-bold uppercase tracking-wider truncate ${activeTab === 'outgoing' ? 'text-emerald-200' : 'text-stone-400'}`}>
                Giden İstekler
              </span>
              <Send className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'outgoing' ? 'text-emerald-300' : 'text-teal-700'}`} />
            </div>
            <div className="text-lg sm:text-xl font-black">{activeOutgoing.length}</div>
            <div className={`text-[9.5px] truncate ${activeTab === 'outgoing' ? 'text-emerald-100' : 'text-stone-500'}`}>
              Yanıt bekleyen
            </div>
          </div>

          {/* Akıllı Eşleşmeler */}
          <div
            onClick={() => setActiveTab('smart_matches')}
            className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'smart_matches'
                ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                : 'bg-white text-stone-700 border-stone-200/90 hover:bg-stone-50'
            }`}
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className={`text-[9.5px] font-bold uppercase tracking-wider truncate ${activeTab === 'smart_matches' ? 'text-emerald-200' : 'text-stone-400'}`}>
                Eşleşmeler
              </span>
              <Sparkles className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'smart_matches' ? 'text-amber-300' : 'text-amber-500'}`} />
            </div>
            <div className="text-lg sm:text-xl font-black">{smartMatches.length}</div>
            <div className={`text-[9.5px] truncate ${activeTab === 'smart_matches' ? 'text-emerald-100' : 'text-stone-500'}`}>
              Yüksek uyumlu
            </div>
          </div>

          {/* Süreçteki Takaslar */}
          <div
            onClick={() => setActiveTab('active_process')}
            className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'active_process'
                ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                : 'bg-white text-stone-700 border-stone-200/90 hover:bg-stone-50'
            }`}
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className={`text-[9.5px] font-bold uppercase tracking-wider truncate ${activeTab === 'active_process' ? 'text-emerald-200' : 'text-stone-400'}`}>
                Canlı Süreç
              </span>
              <Repeat className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'active_process' ? 'text-emerald-300' : 'text-emerald-600'}`} />
            </div>
            <div className="text-lg sm:text-xl font-black">{activeProcessTrades.length}</div>
            <div className={`text-[9.5px] truncate ${activeTab === 'active_process' ? 'text-emerald-100' : 'text-stone-500'}`}>
              Teslimat aşamasında
            </div>
          </div>
        </div>

        {/* Content depending on Active Tab */}
        {activeTab === 'incoming' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-stone-800">
                Gelen Takas İstekleri ({activeIncoming.length})
              </h2>
              <span className="text-xs text-stone-400">Diğer üyelerin sana teklifleri</span>
            </div>

            {activeIncoming.length > 0 ? (
              activeIncoming.map((trade) => (
                <TradeCard
                  key={trade.id}
                  trade={trade}
                  isIncoming={true}
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
              ))
            ) : (
              <div className="text-center py-12 px-4 bg-white rounded-3xl border border-stone-200/90 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto text-xl font-bold">
                  ✓
                </div>
                <h3 className="text-sm font-bold text-stone-800">
                  Bekleyen yeni takas isteği yok
                </h3>
                <p className="text-xs text-stone-500 max-w-xs mx-auto">
                  İlanlarını öne çıkararak veya eşleştirme havuzunda kaydırarak yeni takas teklifleri alabilirsin.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/eslesme')}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Eşleştirme Başlat
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'outgoing' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-stone-800">
                Giden Takas İsteklerin ({activeOutgoing.length})
              </h2>
              <span className="text-xs text-stone-400">Diğer üyelere gönderdiğin teklifler</span>
            </div>

            {activeOutgoing.length > 0 ? (
              activeOutgoing.map((trade) => (
                <TradeCard
                  key={trade.id}
                  trade={trade}
                  isIncoming={false}
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
              ))
            ) : (
              <div className="text-center py-12 px-4 bg-white rounded-3xl border border-stone-200/90 space-y-3">
                <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                  <Send className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-stone-800">
                  Henüz bir takas isteği göndermedin
                </h3>
                <p className="text-xs text-stone-500 max-w-xs mx-auto">
                  İlgilendiğin ürünlerin sahiplerine hızlıca teklif göndererek döngüsel takası başlatabilirsin.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/kesfet')}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  İlanları Keşfet
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'smart_matches' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-stone-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Akıllı Algoritma Eşleşmeleri</span>
              </h2>
              <span className="text-xs text-emerald-700 font-bold">Yüksek Uyum</span>
            </div>

            <div className="space-y-3">
              {smartMatches.map((match) => (
                <div
                  key={match.id}
                  className="p-4 bg-white rounded-3xl border border-stone-200/90 shadow-xs space-y-3 hover:border-emerald-500/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-extrabold border border-emerald-200 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      %{match.matchPercentage} Takas Uyumu
                    </span>
                    <span className="text-xs text-stone-400">
                      {match.targetListing.location.district} ({match.targetListing.location.distanceKm} km)
                    </span>
                  </div>

                  {/* Visual Comparison Card */}
                  <div className="grid grid-cols-2 gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
                    <div className="space-y-1">
                      <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
                        Senin Eşyan
                      </span>
                      <div className="flex items-center gap-2">
                        <img
                          src={match.myListing.images[0]}
                          alt={match.myListing.title}
                          className="w-10 h-10 rounded-xl object-cover border border-stone-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-stone-900 block truncate">
                            {match.myListing.title}
                          </span>
                          <span className="text-[10px] text-stone-500">
                            {match.myListing.condition}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 border-l border-stone-200 pl-3">
                      <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">
                        Karşı Tarafın Eşyası
                      </span>
                      <div className="flex items-center gap-2">
                        <img
                          src={match.targetListing.images[0]}
                          alt={match.targetListing.title}
                          className="w-10 h-10 rounded-xl object-cover border border-stone-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-stone-900 block truncate">
                            {match.targetListing.title}
                          </span>
                          <span className="text-[10px] text-stone-500">
                            {match.targetListing.user.fullName}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-stone-600 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/60 font-medium">
                    💡 {match.reason}
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/teklif-ver?targetId=${match.targetListing.id}`)}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Hemen Teklif Oluştur</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/ilan/${match.targetListing.id}`)}
                      className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      İncele
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'active_process' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-stone-800">
                Canlı Takas Süreçleri ({activeProcessTrades.length})
              </h2>
              <span className="text-xs text-stone-400">Kilitlenen ve teslimatta olan takaslar</span>
            </div>

            {activeProcessTrades.length > 0 ? (
              activeProcessTrades.map((trade) => (
                <div
                  key={trade.id}
                  onClick={() => navigate(`/takas-sureci/${trade.id}`)}
                  className="p-4 bg-white rounded-3xl border-2 border-emerald-600/30 hover:border-emerald-600 shadow-xs space-y-3 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      Güvenli Kilit Aktif
                    </span>
                    <span className="text-xs text-stone-500 font-semibold">
                      Adım 3 / 6 Teslimat
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {trade.offeredListings[0] && (
                        <img
                          src={trade.offeredListings[0].images[0]}
                          alt={trade.offeredListings[0].title}
                          className="w-12 h-12 rounded-xl object-cover border border-stone-200"
                        />
                      )}
                      <div>
                        <span className="text-xs font-bold text-stone-900 block truncate">
                          {trade.offeredListings[0]?.title || 'Teklif Edilen Ürün'}
                        </span>
                        <span className="text-[11px] text-stone-500">
                          {trade.initiator.fullName}
                        </span>
                      </div>
                    </div>

                    <Repeat className="w-5 h-5 text-emerald-600 shrink-0" />

                    <div className="flex items-center gap-2 text-right">
                      <div>
                        <span className="text-xs font-bold text-stone-900 block truncate">
                          {trade.requestedListings[0]?.title || 'İstenen Ürün'}
                        </span>
                        <span className="text-[11px] text-stone-500">
                          {trade.receiver.fullName}
                        </span>
                      </div>
                      {trade.requestedListings[0] && (
                        <img
                          src={trade.requestedListings[0].images[0]}
                          alt={trade.requestedListings[0].title}
                          className="w-12 h-12 rounded-xl object-cover border border-stone-200"
                        />
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Takas Sürecini Görüntüle</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-12 px-4 bg-white rounded-3xl border border-stone-200/90 space-y-3">
                <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-stone-800">
                  Şu an devam eden kilitli takasınız yok
                </h3>
                <p className="text-xs text-stone-500 max-w-xs mx-auto">
                  Gelen veya giden takas teklifleri kabul edildiğinde 6 adımlı teslimat süreci burada canlı olarak takip edilir.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

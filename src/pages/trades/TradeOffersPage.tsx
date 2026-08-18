import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { tradeService } from '../../services/tradeService';
import { TradeCard } from '../../components/common/TradeCard';
import { TradeOffer } from '../../types';
import { ArrowLeftRight, Inbox, Send, CheckCircle2, Clock, Filter, Plus, Sparkles, ShieldCheck } from 'lucide-react';

export const TradeOffersPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing' | 'completed'>('incoming');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [isLoading, setIsLoading] = useState(true);
  const [incomingTrades, setIncomingTrades] = useState<TradeOffer[]>([]);
  const [outgoingTrades, setOutgoingTrades] = useState<TradeOffer[]>([]);
  const [completedTrades, setCompletedTrades] = useState<TradeOffer[]>([]);

  const loadTrades = useCallback(async () => {
    setIsLoading(true);
    const [allTrades, incoming, outgoing] = await Promise.all([
      tradeService.getAllTrades(),
      tradeService.getUserIncomingTrades(currentUser.id),
      tradeService.getUserOutgoingTrades(currentUser.id),
    ]);

    setIncomingTrades(incoming);
    setOutgoingTrades(outgoing);
    setCompletedTrades(
      allTrades.filter(
        (t) =>
          (t.initiatorId === currentUser.id || t.receiverId === currentUser.id) &&
          (t.status === 'completed' || t.status === 'rejected' || t.status === 'cancelled')
      )
    );
    setIsLoading(false);
  }, [currentUser.id]);

  useEffect(() => {
    loadTrades();
  }, [loadTrades]);

  const activeIncoming = incomingTrades.filter(
    (t) => t.status !== 'completed' && t.status !== 'rejected' && t.status !== 'cancelled'
  );
  const activeOutgoing = outgoingTrades.filter(
    (t) => t.status !== 'completed' && t.status !== 'rejected' && t.status !== 'cancelled'
  );

  const getFilteredList = () => {
    let list: TradeOffer[] = [];
    if (activeTab === 'incoming') list = activeIncoming;
    else if (activeTab === 'outgoing') list = activeOutgoing;
    else list = completedTrades;

    if (filterStatus !== 'all') {
      list = list.filter((t) => t.status === filterStatus);
    }
    return list;
  };

  const handleAccept = async (tradeId: string) => {
    const updated = await tradeService.acceptOffer(tradeId);
    if (updated) {
      showToast('Teklif Kabul Edildi!', 'Ürünler takas için kilitlendi. Teslimat planına geçebilirsiniz.', 'success');
      navigate(`/teklif/${tradeId}`);
    }
  };

  const handleReject = async (tradeId: string) => {
    const updated = await tradeService.rejectOffer(tradeId);
    if (updated) {
      showToast('Teklif Reddedildi', 'Takas teklifi geri çevrildi.', 'info');
      loadTrades();
    }
  };

  const currentList = getFilteredList();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 pb-24 text-stone-900 flex items-center justify-center">
        <p className="text-sm text-stone-500">Takaslar yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-24 text-stone-900">
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 pt-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-stone-900 tracking-tight font-display">Takaslarım</h1>
            <p className="text-xs text-stone-500">Devam eden ve tamamlanan takas süreçleriniz</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/eslesme')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <span>🔥 Kaydır & Eşleş</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/kesfet')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni İlan</span>
            </button>
          </div>
        </div>

        {/* Status Highlights Banner */}
        <div className="grid grid-cols-3 gap-2.5">
          <div
            onClick={() => setActiveTab('incoming')}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'incoming'
                ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                : 'bg-white text-stone-700 border-stone-200/80 hover:bg-stone-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[11px] font-bold ${activeTab === 'incoming' ? 'text-emerald-200' : 'text-stone-400'}`}>
                GELEN
              </span>
              <Inbox className={`w-4 h-4 ${activeTab === 'incoming' ? 'text-emerald-300' : 'text-emerald-700'}`} />
            </div>
            <div className="text-xl font-extrabold">{activeIncoming.length}</div>
            <div className={`text-[10px] ${activeTab === 'incoming' ? 'text-emerald-100' : 'text-stone-500'}`}>
              Onay bekleyen
            </div>
          </div>

          <div
            onClick={() => setActiveTab('outgoing')}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'outgoing'
                ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                : 'bg-white text-stone-700 border-stone-200/80 hover:bg-stone-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[11px] font-bold ${activeTab === 'outgoing' ? 'text-emerald-200' : 'text-stone-400'}`}>
                GİDEN
              </span>
              <Send className={`w-4 h-4 ${activeTab === 'outgoing' ? 'text-emerald-300' : 'text-teal-700'}`} />
            </div>
            <div className="text-xl font-extrabold">{activeOutgoing.length}</div>
            <div className={`text-[10px] ${activeTab === 'outgoing' ? 'text-emerald-100' : 'text-stone-500'}`}>
              Yanıt bekleyen
            </div>
          </div>

          <div
            onClick={() => setActiveTab('completed')}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'completed'
                ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                : 'bg-white text-stone-700 border-stone-200/80 hover:bg-stone-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[11px] font-bold ${activeTab === 'completed' ? 'text-emerald-200' : 'text-stone-400'}`}>
                GEÇMİŞ
              </span>
              <CheckCircle2 className={`w-4 h-4 ${activeTab === 'completed' ? 'text-emerald-300' : 'text-emerald-600'}`} />
            </div>
            <div className="text-xl font-extrabold">{completedTrades.length}</div>
            <div className={`text-[10px] ${activeTab === 'completed' ? 'text-emerald-100' : 'text-stone-500'}`}>
              Sonuçlanan
            </div>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-200/60 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab('incoming');
              setFilterStatus('all');
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'incoming' ? 'bg-white text-emerald-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Gelen Teklifler ({activeIncoming.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('outgoing');
              setFilterStatus('all');
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'outgoing' ? 'bg-white text-emerald-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Giden Teklifler ({activeOutgoing.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('completed');
              setFilterStatus('all');
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'completed' ? 'bg-white text-emerald-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Geçmiş Takaslar ({completedTrades.length})
          </button>
        </div>

        {/* List of Trades */}
        <div className="space-y-3">
          {currentList.length > 0 ? (
            currentList.map((trade) => (
              <TradeCard
                key={trade.id}
                trade={trade}
                isIncoming={trade.receiverId === currentUser.id}
                onAccept={handleAccept}
                onReject={handleReject}
              />
            ))
          ) : (
            <div className="text-center py-12 px-4 bg-white rounded-2xl border border-stone-200/80">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3">
                <ArrowLeftRight className="w-6 h-6 text-stone-400" />
              </div>
              <h3 className="text-sm font-bold text-stone-800 mb-1">
                {activeTab === 'incoming'
                  ? 'Henüz gelen bir takas teklifi yok'
                  : activeTab === 'outgoing'
                  ? 'Henüz bir takas teklifi göndermediniz'
                  : 'Henüz tamamlanmış bir takasınız bulunmuyor'}
              </h3>
              <p className="text-xs text-stone-500 max-w-xs mx-auto mb-4">
                {activeTab === 'incoming'
                  ? 'İlanlarınızı öne çıkararak diğer kullanıcıların teklif vermesini sağlayabilirsiniz.'
                  : 'Keşfet sayfasındaki binlerce sürdürülebilir ilandan birine teklif gönderin.'}
              </p>
              <button
                type="button"
                onClick={() => navigate('/kesfet')}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                İlanları Keşfet
              </button>
            </div>
          )}
        </div>

        {/* 6-Step Safety Protocol Info Box */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-900 to-teal-900 text-white">
          <div className="flex items-center gap-2 mb-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <h4 className="text-xs font-bold">Swaloop 6 Adımlı Güvenli Takas</h4>
          </div>
          <p className="text-[11px] text-emerald-100/90 leading-relaxed">
            Teklif kabul edildiğinde ürünler diğer kullanıcılara otomatik kilitlenir. Teslimat tamamlanıp her iki taraf onaylayana kadar takas güvence altındadır.
          </p>
        </div>
      </div>
    </div>
  );
};

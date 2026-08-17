import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { loopService } from '../../services/loopService';
import { MYSTERY_SWAP_ITEMS, PAPERCLIP_STAGES } from '../../data/mockData';
import { Loop } from '../../types';
import {
  Repeat,
  Sparkles,
  ArrowRight,
  Gift,
  Paperclip,
  TrendingUp,
  CheckCircle2,
  Users,
  ShieldCheck,
  Leaf,
  Droplets,
  Zap,
  Info,
} from 'lucide-react';

export const LoopsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'loops' | 'mystery' | 'paperclip'>('loops');
  const [loops, setLoops] = useState<Loop[]>(() => loopService.getLoops());
  const [selectedLoop, setSelectedLoop] = useState<Loop | undefined>(loops[0]);

  const handleConfirmStep = (loopId: string) => {
    const updated = loopService.confirmParticipantStep(loopId, currentUser.id);
    if (updated) {
      setLoops(loopService.getLoops());
      setSelectedLoop({ ...updated });
      showToast('Döngü Adımınız Onaylandı!', 'Tüm katılımcılar onayladığında teslimat başlayacaktır.', 'success');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-28 text-stone-900">
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 pt-4 space-y-4">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-xl bg-emerald-800 text-white">
              <Repeat className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">Swaloop Döngüleri</h1>
          </div>
          <p className="text-xs text-stone-500">
            Çoklu dairesel takaslar, gizemli kutular ve ataş meydan okuması
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1 p-1 bg-stone-200/60 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('loops')}
            className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer ${
              activeTab === 'loops' ? 'bg-white text-emerald-950 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Repeat className="w-3.5 h-3.5 shrink-0" />
            <span>Döngüler</span>
            <span className="hidden md:inline text-[10px] opacity-75">(3'lü Takas)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mystery')}
            className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer ${
              activeTab === 'mystery' ? 'bg-white text-emerald-950 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Gift className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Gizemli Kutu</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('paperclip')}
            className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer ${
              activeTab === 'paperclip' ? 'bg-white text-emerald-950 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            <span>Takas Yolculuğu</span>
          </button>
        </div>

        {/* 1. Multi-Party Loops Tab */}
        {activeTab === 'loops' && selectedLoop && (
          <div className="space-y-4">
            {/* Active Loop Visualizer Card */}
            <div className="bg-white rounded-3xl border border-stone-200/90 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md">
                    Aktif 3'lü Eşleşme
                  </span>
                  <h2 className="text-base font-bold text-stone-900 mt-1">{selectedLoop.title}</h2>
                </div>
                <span className="text-xs font-bold text-stone-500">
                  {selectedLoop.participants.length} Katılımcı
                </span>
              </div>

              {/* Circular Exchange Flow Diagram */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-stone-700 pb-2 border-b border-stone-200">
                  <span>Dairesel Eşya Akışı</span>
                  <span className="text-emerald-700">Kim Kime Ne Veriyor?</span>
                </div>

                <div className="space-y-2.5">
                  {selectedLoop.participants.map((p, idx) => {
                    const isMe = p.userId === currentUser.id;
                    const nextUser = selectedLoop.participants.find((u) => u.userId === p.givesToUserId);

                    return (
                      <div
                        key={p.userId}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                          isMe ? 'bg-emerald-50/70 border-emerald-300' : 'bg-white border-stone-200'
                        }`}
                      >
                        {/* Giver */}
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <img
                            src={p.user.avatarUrl}
                            alt={p.user.fullName}
                            className="w-8 h-8 rounded-full object-cover border border-stone-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-stone-900 block truncate">
                              {p.user.fullName} {isMe && '(Sen)'}
                            </span>
                            <span className="text-[10px] text-stone-500 truncate block">
                              Verdiği: <strong className="text-stone-700">{p.offeringListing.title}</strong>
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-center px-1">
                          <ArrowRight className="w-4 h-4 text-emerald-800" />
                          <span className="text-[8px] font-bold text-emerald-800 uppercase">Devrediyor</span>
                        </div>

                        {/* Receiver */}
                        <div className="flex items-center gap-2 min-w-0 flex-1 justify-end text-right">
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-stone-900 block truncate">
                              {nextUser?.user.fullName}
                            </span>
                            <span className="text-[10px] text-stone-500 truncate block">
                              Alacağı: <strong className="text-stone-700">{p.offeringListing.title}</strong>
                            </span>
                          </div>
                          <img
                            src={nextUser?.user.avatarUrl}
                            alt={nextUser?.user.fullName}
                            className="w-8 h-8 rounded-full object-cover border border-stone-200 shrink-0"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Loop Total Impact */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-900 to-teal-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-emerald-300" />
                  <div>
                    <span className="text-xs font-bold text-emerald-200 block">Döngünün Toplam SVS Tasarrufu</span>
                    <span className="text-sm font-extrabold text-white">
                      +{selectedLoop.totalImpact.co2eKg} kg CO₂e • +{selectedLoop.totalImpact.waterLiters} L Su
                    </span>
                  </div>
                </div>
              </div>

              {/* Loop Action */}
              <button
                type="button"
                onClick={() => handleConfirmStep(selectedLoop.id)}
                className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Döngü Katılımımı ve Eşyamı Onayla</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. Mystery Swap Tab */}
        {activeTab === 'mystery' && (
          <div className="space-y-4">
            <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200/80 text-amber-950 flex items-start gap-3">
              <Gift className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs">
                <h3 className="font-bold mb-1 text-sm">Gizemli Kutu Takası Nasıl Çalışır?</h3>
                <p className="leading-relaxed text-amber-900/90">
                  Ürünün tam modeli gizlidir; yalnızca kategorisi, durum ipucu ve SVS çevresel değeri belirtilir. Sürpriz ve maceracı takasçılar için heyecan verici bir sıfır atık deneyimi!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MYSTERY_SWAP_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl border border-stone-200/90 p-4 shadow-xs space-y-3"
                >
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-stone-900">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover blur-md scale-105 opacity-80"
                    />
                    <div className="absolute inset-0 bg-stone-950/40 flex flex-col items-center justify-center text-white">
                      <Gift className="w-8 h-8 text-amber-400 mb-1 animate-bounce" />
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-200">
                        Gizemli Kutu
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-stone-900">{item.title}</h4>
                    <p className="text-xs text-stone-600 italic mt-1 bg-stone-50 p-2 rounded-xl">
                      "{item.hint}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100">
                    <span className="text-emerald-700 font-bold">+{item.estimatedCo2e} kg CO₂e</span>
                    <span>{item.location}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      showToast('Gizemli Takas Teklifi İletildi!', 'Kutunun sahibiyle eşleşme sağlandı.', 'success');
                    }}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    Kutuyu Takas Et
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Takas Yolculuğum Tab */}
        {activeTab === 'paperclip' && (
          <div className="space-y-4">
            <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-950 via-stone-900 to-stone-950 text-white flex items-start justify-between gap-3 shadow-xs">
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase tracking-wider text-[10px]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Kendi Eşyalarınla Değer Büyütme</span>
                </div>
                <h3 className="font-black text-sm text-white">Takas Yolculuğum (Basamak Yükseltme)</h3>
                <p className="leading-relaxed text-stone-300 text-[11px]">
                  Küçük bir eşya ile başlayıp takas adımlarıyla kademe kademe değer ve faydayı büyüt.
                  Tüm aşamaları kendi ilanların ve hedeflerin üzerinden canlı yönetebilirsin.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/takas-yolculugum')}
                className="px-3.5 py-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shrink-0 flex items-center gap-1 transition-all shadow-xs cursor-pointer"
              >
                <span>Yolculuğa Git</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-stone-200/90 p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Örnek Takas Basamakları
                </h3>
                <button
                  type="button"
                  onClick={() => navigate('/takas-yolculugum')}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-900"
                >
                  Kendi Eşyanı Ekle →
                </button>
              </div>

              <div className="space-y-3">
                {PAPERCLIP_STAGES.map((stage) => (
                  <div
                    key={stage.stageNumber}
                    className={`p-3.5 rounded-2xl border flex items-center gap-3.5 ${
                      stage.isCompleted
                        ? 'bg-emerald-50/60 border-emerald-300'
                        : stage.isCurrent
                        ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/30'
                        : 'bg-stone-50 border-stone-200 opacity-60'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        stage.isCompleted
                          ? 'bg-emerald-700 text-white'
                          : stage.isCurrent
                          ? 'bg-amber-500 text-white animate-pulse'
                          : 'bg-stone-200 text-stone-500'
                      }`}
                    >
                      {stage.stageNumber}
                    </div>

                    <img
                      src={stage.image}
                      alt={stage.itemTitle}
                      className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-stone-900 truncate">{stage.itemTitle}</h4>
                        {stage.isCurrent && (
                          <span className="text-[9px] font-bold bg-amber-500 text-white px-1.5 py-0.2 rounded-full">
                            Aktif Basamak
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-emerald-700 font-semibold block">
                        +{stage.estimatedImpact} kg CO₂e Tasarrufu
                      </span>
                    </div>

                    {stage.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                    ) : stage.isCurrent ? (
                      <button
                        type="button"
                        onClick={() => navigate('/takas-yolculugum')}
                        className="px-3 py-1.5 bg-emerald-800 text-white text-xs font-bold rounded-xl shrink-0 hover:bg-emerald-900 transition-colors"
                      >
                        Yükselt
                      </button>
                    ) : (
                      <span className="text-[10px] text-stone-400 font-bold">Kilitli</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

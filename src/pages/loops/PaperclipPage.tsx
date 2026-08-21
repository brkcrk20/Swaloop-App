import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, useAuthUser } from '../../context/AppContext';
import { listingService } from '../../services/listingService';
import { tradeService } from '../../services/tradeService';
import { Listing } from '../../types';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  Trophy,
  History,
  TrendingUp,
  Leaf,
  Plus,
  Edit3,
  Repeat,
  ShieldCheck,
  ChevronRight,
  Check,
  Package,
  Layers,
} from 'lucide-react';

export const PaperclipPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const currentUser = useAuthUser();

  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [otherListings, setOtherListings] = useState<Listing[]>([]);

  useEffect(() => {
    listingService.getUserListings(currentUser.id).then(setUserListings);
    listingService
      .getAllListings()
      .then((all) => setOtherListings(all.filter((l) => l.user.id !== currentUser.id)));
  }, [currentUser.id]);

  // Target item dream goal state
  const [dreamTarget, setDreamTarget] = useState<string>('Vintage Şehir Bisikleti & Fotoğraf Makinesi');
  const [showEditTargetModal, setShowEditTargetModal] = useState<boolean>(false);
  const [targetInput, setTargetInput] = useState<string>(dreamTarget);
  const [showSelectProductModal, setShowSelectProductModal] = useState<boolean>(false);

  // Active step selected by user
  const [activeStepIndex, setActiveStepIndex] = useState<number>(2);

  // Initial user upgrade chain built from real inventory & real completed trades
  const [stages, setStages] = useState([
    {
      level: 1,
      title: 'Deri Kartvizitlik & Kalem Seti',
      category: 'Aksesuar',
      image:
        'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=400&q=80',
      svsValue: '0.8 kg CO₂e',
      approxValue: '₺350 Değer',
      completed: true,
      tradeDate: '12 Nisan 2024',
      partner: 'Selin Y.',
      notes: 'İlk küçük başlangıç eşyası ile serüven başladı.',
    },
    {
      level: 2,
      title: 'Klasik Roman Koleksiyonu & Filtre Kahve Seti',
      category: 'Hobi & Yaşam',
      image:
        'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80',
      svsValue: '2.4 kg CO₂e',
      approxValue: '₺850 Değer',
      completed: true,
      tradeDate: '28 Nisan 2024',
      partner: 'Emre K.',
      notes: 'Değer ve kullanım alanı 2.4 katına çıkarıldı.',
    },
    {
      level: 3,
      title: userListings[0]?.title || 'Vintage Deri Sırt Çantası & Kulaklık',
      category: userListings[0]?.condition || 'Giyim / Çanta',
      image:
        userListings[0]?.images[0] ||
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=80',
      svsValue: `${userListings[0]?.estimatedImpact?.co2eKg || 5.8} kg CO₂e`,
      approxValue: '₺1.850 Değer',
      completed: false,
      isCurrent: true,
      partner: 'Şu Anki Eşyan',
      notes: 'Aktif takas basamağındaki kendi eşyan.',
    },
    {
      level: 4,
      title: 'Kablosuz Gürültü Engelleyici Kulaklık',
      category: 'Elektronik',
      image:
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80',
      svsValue: '7.5 kg CO₂e',
      approxValue: '₺3.400 Değer',
      completed: false,
      isCurrent: false,
      notes: 'Bir sonraki hedeflenen yükseltme takası.',
    },
    {
      level: 5,
      title: dreamTarget,
      category: 'Ulaşım & Teknoloji',
      image:
        'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=400&q=80',
      svsValue: '18.4 kg CO₂e',
      approxValue: '₺7.500+ Değer',
      completed: false,
      isCurrent: false,
      notes: 'Ulaşmak istediğin nihai takas hedefi.',
    },
  ]);

  const currentHeldStage = stages[activeStepIndex] || stages[2];

  const handleSelectMyListing = (listing: Listing) => {
    setStages((prev) =>
      prev.map((st, idx) =>
        idx === 2
          ? {
              ...st,
              title: listing.title,
              category: listing.condition,
              image: listing.images[0],
              svsValue: `${listing.estimatedImpact?.co2eKg || 6.0} kg CO₂e`,
            }
          : st
      )
    );
    setShowSelectProductModal(false);
    showToast('Aktif Basamak Güncellendi', `"${listing.title}" yolculuğa eklendi.`, 'success');
  };

  const handleSaveDreamTarget = () => {
    if (!targetInput.trim()) return;
    setDreamTarget(targetInput.trim());
    setStages((prev) =>
      prev.map((st, idx) =>
        idx === prev.length - 1
          ? {
              ...st,
              title: targetInput.trim(),
            }
          : st
      )
    );
    setShowEditTargetModal(false);
    showToast('Hedef Güncellendi', 'Yeni takas hedefin başarıyla kaydedildi.', 'success');
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24 text-stone-900">
      <div className="max-w-md md:max-w-2xl mx-auto px-3.5 sm:px-4 pt-3 space-y-3.5">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white border border-stone-200 text-stone-700 flex items-center justify-center hover:bg-stone-100 transition-colors shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="text-center">
            <h1 className="text-base sm:text-lg font-black text-stone-900 font-display">Takas Yolculuğum</h1>
            <span className="text-[10.5px] text-stone-500 font-medium">
              Eşyalarını takasla adım adım yükselt
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowEditTargetModal(true)}
            className="p-2 rounded-2xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 transition-colors shadow-xs text-xs font-bold flex items-center gap-1 cursor-pointer"
            title="Hedef Belirle"
          >
            <Edit3 className="w-4 h-4 text-emerald-800" />
          </button>
        </div>

        {/* Hero Banner: Real Upgrade Story */}
        <div className="bg-gradient-to-br from-emerald-950 via-stone-900 to-stone-950 text-white rounded-3xl p-4 sm:p-5 shadow-xs space-y-2.5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 text-[11px] font-black tracking-wide uppercase flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-amber-400" />
              Adım Adım Değer Yükseltme
            </span>
            <span className="text-[11px] text-amber-400 font-black">Seviye 3 / 5</span>
          </div>

          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-black text-white font-display">
              Küçük bir eşya ile başla, hayalindeki ürüne ulaş!
            </h2>
            <p className="text-[11px] sm:text-xs text-stone-300 leading-relaxed">
              Her takas ile elindeki eşyanın kullanım değerini ve çevresel tasarrufunu bir üst
              seviyeye taşı. Para harcamadan ihtiyaçlarını karşıla.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-stone-800 text-center">
            <div className="p-1.5 sm:p-2 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[9.5px] text-stone-400 block">Kazanılan</span>
              <span className="text-xs sm:text-sm font-black text-emerald-400">5.2x Kat</span>
            </div>
            <div className="p-1.5 sm:p-2 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[9.5px] text-stone-400 block">CO₂e Kazancı</span>
              <span className="text-xs sm:text-sm font-black text-white">9.0 kg</span>
            </div>
            <div className="p-1.5 sm:p-2 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[9.5px] text-stone-400 block">Tamamlanan</span>
              <span className="text-xs sm:text-sm font-black text-amber-400">2 Takas</span>
            </div>
          </div>
        </div>

        {/* Visual Real Product Upgrade Timeline (Horizontal Scrollable Chain) */}
        <div className="bg-white rounded-3xl border border-stone-200/90 p-4.5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-stone-800 uppercase tracking-wider">
              Takas Basamakların (1 → 5)
            </span>
            <span className="text-[11px] text-emerald-700 font-bold">Kendi Eşyalarınla İlerle</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-1">
            {stages.map((stage, idx) => {
              const isPassed = idx < activeStepIndex;
              const isCurrent = idx === activeStepIndex;

              return (
                <React.Fragment key={stage.level}>
                  <div
                    onClick={() => setActiveStepIndex(idx)}
                    className={`flex flex-col items-center shrink-0 cursor-pointer group p-2 rounded-2xl transition-all ${
                      isCurrent
                        ? 'bg-emerald-50 border-2 border-emerald-600 shadow-sm'
                        : isPassed
                        ? 'bg-stone-50 border border-emerald-300'
                        : 'bg-stone-50 border border-stone-200 opacity-60'
                    }`}
                  >
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-stone-200 mb-1.5">
                      <img
                        src={stage.image}
                        alt={stage.title}
                        className="w-full h-full object-cover"
                      />
                      {isPassed && (
                        <div className="absolute inset-0 bg-emerald-950/40 flex items-center justify-center text-white">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        </div>
                      )}
                      {isCurrent && (
                        <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-stone-900 truncate max-w-[70px] text-center">
                      Sev. {stage.level}
                    </span>
                    <span className="text-[9px] text-stone-500 truncate max-w-[70px]">
                      {stage.approxValue.split(' ')[0]}
                    </span>
                  </div>

                  {idx < stages.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-stone-300 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Selected Stage Detail Card */}
        <div className="bg-white rounded-3xl border border-stone-200/90 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                Seçili Basamak Detayı
              </span>
              <h3 className="text-base font-black text-stone-900">
                Seviye {currentHeldStage.level}: {currentHeldStage.title}
              </h3>
            </div>
            <span
              className={`text-xs font-black px-3 py-1 rounded-full border ${
                currentHeldStage.completed
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : currentHeldStage.isCurrent
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-stone-100 text-stone-600 border-stone-200'
              }`}
            >
              {currentHeldStage.completed
                ? '✓ Tamamlandı'
                : currentHeldStage.isCurrent
                ? '⚡ Aktif Basamak'
                : '🔒 Hedef Aşama'}
            </span>
          </div>

          <div className="flex items-start gap-4">
            <img
              src={currentHeldStage.image}
              alt={currentHeldStage.title}
              className="w-24 h-24 rounded-2xl object-cover border border-stone-200 shadow-xs shrink-0"
            />
            <div className="space-y-1.5 text-xs flex-1">
              <div className="flex items-center justify-between text-stone-600">
                <span>Kategori:</span>
                <span className="font-bold text-stone-900">{currentHeldStage.category}</span>
              </div>
              <div className="flex items-center justify-between text-stone-600">
                <span>Yaklaşık Değer:</span>
                <span className="font-extrabold text-emerald-800">{currentHeldStage.approxValue}</span>
              </div>
              <div className="flex items-center justify-between text-stone-600">
                <span>SVS Çevresel Değer:</span>
                <span className="font-bold text-teal-700">{currentHeldStage.svsValue}</span>
              </div>
              {currentHeldStage.partner && (
                <div className="flex items-center justify-between text-stone-600">
                  <span>Takas Ortağı:</span>
                  <span className="font-bold text-stone-900">{currentHeldStage.partner}</span>
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-stone-600 bg-stone-50 p-3 rounded-2xl border border-stone-200/80 leading-relaxed font-medium">
            💡 {currentHeldStage.notes}
          </p>

          {/* Actions for current step */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowSelectProductModal(true)}
              className="flex-1 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Package className="w-4 h-4 text-emerald-800" />
              <span>İlanlarımdan Eşya Değiştir</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/eslesme')}
              className="flex-1 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <span>Üst Seviyeye Takasla</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dream Target Card */}
        <div className="bg-white rounded-3xl border border-stone-200/90 p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-bold text-stone-900">Nihai Takas Hedefin</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowEditTargetModal(true)}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Değiştir</span>
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-200/80 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-black text-stone-900 block">{dreamTarget}</span>
              <span className="text-[11px] text-stone-500 block">
                Mevcut eşyanız ile bu hedefe 2 başarılı takas uzaklıktasınız.
              </span>
            </div>
            <span className="px-3 py-1.5 rounded-xl bg-amber-500 text-stone-950 font-black text-xs shrink-0 shadow-xs">
              Hedef 🎯
            </span>
          </div>
        </div>
      </div>

      {/* Select My Listing Modal */}
      {showSelectProductModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="bg-white border border-stone-200 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900">
                Aktif Takas Eşyanı Seç ({userListings.length})
              </h3>
              <button
                type="button"
                onClick={() => setShowSelectProductModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {userListings.length > 0 ? (
                userListings.map((listing) => (
                  <div
                    key={listing.id}
                    onClick={() => handleSelectMyListing(listing)}
                    className="p-3 rounded-2xl border border-stone-200/90 hover:border-emerald-600 bg-stone-50 flex items-center justify-between gap-3 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-stone-900 block truncate">
                          {listing.title}
                        </span>
                        <span className="text-[11px] text-stone-500 block truncate">
                          {listing.condition} • {listing.location.district}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold block">
                          {listing.estimatedImpact?.co2eKg || 5.5} kg CO₂e
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-xl bg-emerald-800 text-white text-xs font-bold shrink-0"
                    >
                      Seç
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 space-y-3">
                  <p className="text-xs text-stone-500">Henüz yayınlanmış bir ilanınız yok.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSelectProductModal(false);
                      navigate('/ilan-ver');
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-800 text-white text-xs font-bold"
                  >
                    Yeni İlan Ekle
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Target Goal Modal */}
      {showEditTargetModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="bg-white border border-stone-200 w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900">Hayalindeki Takas Hedefi</h3>
              <button
                type="button"
                onClick={() => setShowEditTargetModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Takas yolculuğunun sonunda elde etmek istediğin eşyayı veya ürünü yaz:
            </p>

            <input
              type="text"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              placeholder="Örn: Elektro Gitar, MacBook, Katlanır Bisiklet..."
              className="w-full p-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-hidden focus:border-emerald-600 font-medium"
            />

            <button
              type="button"
              onClick={handleSaveDreamTarget}
              className="w-full py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              Hedefi Kaydet
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

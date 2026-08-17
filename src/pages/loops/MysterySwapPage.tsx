import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  ArrowLeft,
  Gift,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  RefreshCw,
  Zap,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const MysterySwapPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();

  const [isOpening, setIsOpening] = useState(false);
  const [revealedItem, setRevealedItem] = useState<{
    title: string;
    category: string;
    svsPoints: number;
    co2e: string;
    photo: string;
    sender: string;
  } | null>(null);

  const sampleRewards = [
    {
      title: 'Analog Vintage Fotoğraf Makinesi',
      category: 'Fotoğraf & Hobi',
      svsPoints: 480,
      co2e: '5.4 kg CO₂e',
      photo: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=80',
      sender: 'Zeynep B.',
    },
    {
      title: 'Retro Mekanik Klavye & Tuş Takımı',
      category: 'Elektronik',
      svsPoints: 520,
      co2e: '4.8 kg CO₂e',
      photo: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=80',
      sender: 'Kerem D.',
    },
    {
      title: 'Deri Sırt Çantası & Defter Seti',
      category: 'Moda & Aksesuar',
      svsPoints: 360,
      co2e: '3.2 kg CO₂e',
      photo: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&auto=format&fit=crop&q=80',
      sender: 'Merve A.',
    },
  ];

  const handleOpenBox = () => {
    setIsOpening(true);
    setTimeout(() => {
      const reward = sampleRewards[Math.floor(Math.random() * sampleRewards.length)];
      setRevealedItem(reward);
      setIsOpening(false);
      showToast('Kutu Açıldı! 🎁', `Tebrikler: ${reward.title}`, 'success');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24 text-stone-900">
      <div className="max-w-md md:max-w-xl mx-auto px-4 pt-4 space-y-5">
        {/* Top Header Matching Screen 18 */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl bg-white border border-stone-200 text-stone-700 flex items-center justify-center hover:bg-stone-100 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-extrabold text-stone-900 font-display">Mystery Swap</h1>
          <div className="w-10" />
        </div>

        {/* Hero Banner Matching Screen 18 */}
        <div className="bg-stone-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden text-center space-y-4">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Golden Gift Box Visual */}
          <div className="flex justify-center py-4">
            <div className="relative">
              <div
                className={`w-32 h-32 rounded-3xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-6xl shadow-2xl shadow-amber-500/30 border-4 border-amber-300 transition-all ${
                  isOpening ? 'animate-bounce scale-110' : 'hover:rotate-3'
                }`}
              >
                🎁
              </div>
              <Sparkles className="w-6 h-6 text-amber-300 absolute -top-2 -right-2 animate-spin duration-1000" />
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white font-display">
              Sürpriz bir takas seni bekliyor!
            </h2>
            <p className="text-xs text-amber-300 font-semibold">
              250 - 600 SVS aralığında sürpriz ürünler.
            </p>
          </div>

          <p className="text-xs text-stone-400 max-w-xs mx-auto leading-relaxed">
            Eşit SVS değerine sahip sürpriz bir eşya havuzundan rastgele bir ürün seç ve takası hemen başlat.
          </p>

          {/* Button Matching Screen 18 */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleOpenBox}
              disabled={isOpening}
              className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-base shadow-lg shadow-amber-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isOpening ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Kutu Açılıyor...</span>
                </>
              ) : (
                <>
                  <span>Kutuyu Aç</span>
                  <Sparkles className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Revealed Item Display */}
        {revealedItem && (
          <div className="bg-white rounded-3xl border-2 border-amber-400 p-5 shadow-lg space-y-3 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Kutudan Çıkan Eşya
              </span>
              <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                {revealedItem.co2e}
              </span>
            </div>

            <div className="flex gap-3.5 items-center">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                <img
                  src={revealedItem.photo}
                  alt={revealedItem.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-stone-900 leading-snug">
                  {revealedItem.title}
                </h3>
                <span className="text-xs text-stone-500 block mt-0.5">
                  {revealedItem.category} • Gönderen: {revealedItem.sender}
                </span>
                <span className="text-xs font-bold text-amber-700 mt-1 block">
                  Değer: {revealedItem.svsPoints} SVS Puanı
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => navigate('/ilan/canon-eos-200d')}
                className="flex-1 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-colors shadow-xs"
              >
                Takası Kabul Et
              </button>
              <button
                type="button"
                onClick={handleOpenBox}
                className="px-4 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors"
              >
                Yeniden Dene
              </button>
            </div>
          </div>
        )}

        {/* Safety & SVS Fair Exchange Guarantee */}
        <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-900 leading-relaxed">
            <strong className="block font-bold">Eşit SVS Değer Güvencesi</strong>
            Tüm Mystery Swap ürünleri onaylanmış, çalışır durumda ve belirlenen SVS etki puanı aralığındadır.
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { SvsExplanationModal } from '../../components/common/SvsExplanationModal';
import {
  ArrowLeft,
  ChevronDown,
  Droplets,
  Zap,
  Leaf,
  Repeat,
  Trees,
  Car,
  Bath,
  Lightbulb,
  Share2,
  Download,
  Info,
  Sparkles,
} from 'lucide-react';

export const ImpactBreakdownPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, showToast } = useApp();
  const [selectedMonth, setSelectedMonth] = useState('Mayıs 2024');
  const [showSvsModal, setShowSvsModal] = useState(false);
  const [showDetailedSection, setShowDetailedSection] = useState(false);

  const stats = currentUser.stats;

  // Real world equivalents calculated from SVS algorithms
  const treesEquivalent = (stats.totalCo2Prevented / 21.7).toFixed(1);
  const carKmEquivalent = Math.round(stats.totalCo2Prevented * 7.5);
  const showerEquivalent = Math.round(stats.totalWaterSaved / 65);
  const lightbulbDaysEquivalent = Math.round((stats.totalEnergySaved * 1000) / (10 * 24));

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast('Etki Raporu Kopyalandı', 'Sürdürülebilirlik kartınızı paylaşabilirsiniz!', 'success');
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24 text-stone-900">
      <div className="max-w-md md:max-w-xl mx-auto px-4 pt-4 space-y-5">
        {/* Top Header Matching Screen 13 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-2xl bg-white border border-stone-200 text-stone-700 flex items-center justify-center hover:bg-stone-100 transition-colors shadow-xs"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-extrabold text-stone-900 font-display">Swaloop Etkim</h1>
          </div>

          {/* Month Selector Dropdown Matching Screen 13 */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="appearance-none bg-white border border-stone-200/90 text-stone-800 text-xs font-bold py-2 pl-3.5 pr-8 rounded-2xl focus:outline-hidden focus:border-emerald-600 shadow-xs cursor-pointer"
            >
              <option value="Mayıs 2024">Mayıs 2024</option>
              <option value="Nisan 2024">Nisan 2024</option>
              <option value="Mart 2024">Mart 2024</option>
              <option value="Tüm Zamanlar">Tüm Zamanlar</option>
            </select>
            <ChevronDown className="w-4 h-4 text-stone-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Center Circular Radial Gauge Card Matching Screen 13 */}
        <div className="bg-white rounded-3xl border border-stone-200/90 p-6 shadow-xs flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="relative w-48 h-48 flex items-center justify-center my-2">
            {/* Background SVG Gauge Ring */}
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#e7e5e4"
                strokeWidth="7"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#065f46"
                strokeWidth="7"
                strokeDasharray="264"
                strokeDashoffset="65"
                strokeLinecap="round"
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Toplam Etki
              </span>
              <span className="text-4xl font-black text-emerald-950 font-display tracking-tight mt-0.5">
                {stats.totalCo2Prevented || 127} kg
              </span>
              <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-widest">
                CO₂e
              </span>
            </div>
          </div>

          <p className="text-xs text-stone-500 max-w-xs mt-2">
            Bu ay gerçekleştirdiğin 4 takas ile yeni üretim kaynaklı karbon salınımını önledin.
          </p>
        </div>

        {/* 4 Circular Sub-Metric Cards Matching Screen 13 */}
        <div className="grid grid-cols-2 gap-3">
          {/* 1. Su */}
          <div className="bg-white rounded-2xl border border-stone-200/90 p-4 flex items-center gap-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-700 flex items-center justify-center text-2xl shrink-0">
              💧
            </div>
            <div>
              <span className="text-base font-extrabold text-stone-900 block leading-tight">
                {stats.totalWaterSaved.toLocaleString('tr-TR') || '2.840'} L
              </span>
              <span className="text-[11px] text-stone-500 font-medium">Su Tasarrufu</span>
            </div>
          </div>

          {/* 2. Enerji */}
          <div className="bg-white rounded-2xl border border-stone-200/90 p-4 flex items-center gap-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center text-2xl shrink-0">
              ⚡
            </div>
            <div>
              <span className="text-base font-extrabold text-stone-900 block leading-tight">
                {stats.totalEnergySaved.toLocaleString('tr-TR') || '1.240'} kWh
              </span>
              <span className="text-[11px] text-stone-500 font-medium">Enerji Tasarrufu</span>
            </div>
          </div>

          {/* 3. Hammadde */}
          <div className="bg-white rounded-2xl border border-stone-200/90 p-4 flex items-center gap-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center text-2xl shrink-0">
              🌿
            </div>
            <div>
              <span className="text-base font-extrabold text-stone-900 block leading-tight">
                18 kg
              </span>
              <span className="text-[11px] text-stone-500 font-medium">Hammadde</span>
            </div>
          </div>

          {/* 4. Yeniden Kullanım */}
          <div className="bg-white rounded-2xl border border-stone-200/90 p-4 flex items-center gap-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center text-2xl shrink-0">
              🔄
            </div>
            <div>
              <span className="text-base font-extrabold text-stone-900 block leading-tight">
                31 adet
              </span>
              <span className="text-[11px] text-stone-500 font-medium">Yeniden Kullanım</span>
            </div>
          </div>
        </div>

        {/* Detailed Equivalents Section */}
        {showDetailedSection && (
          <div className="bg-white rounded-3xl border border-stone-200/90 p-5 space-y-4 shadow-xs animate-in fade-in-50 duration-200">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              Bu Tasarruf Günlük Hayatta Neye Denk Geliyor?
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-2.5">
                <Trees className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-extrabold text-emerald-950 block">{treesEquivalent} Ağaç</span>
                  <span className="text-[10px] text-emerald-900/80">Yıllık CO₂ emilimi</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-start gap-2.5">
                <Car className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-extrabold text-teal-950 block">{carKmEquivalent} km</span>
                  <span className="text-[10px] text-teal-900/80">Egzoz tasarrufu</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-cyan-50 border border-cyan-200/80 flex items-start gap-2.5">
                <Bath className="w-5 h-5 text-cyan-700 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-extrabold text-cyan-950 block">{showerEquivalent} Duş</span>
                  <span className="text-[10px] text-cyan-900/80">15 dk duş suyu</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-2.5">
                <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-extrabold text-amber-950 block">{lightbulbDaysEquivalent} Gün</span>
                  <span className="text-[10px] text-amber-900/80">LED aydınlatma</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom CTA Button Matching Screen 13 */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              setShowDetailedSection(!showDetailedSection);
              setShowSvsModal(true);
            }}
            className="w-full py-4 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-base shadow-md shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Detaylı Rapor</span>
          </button>
        </div>
      </div>

      {showSvsModal && <SvsExplanationModal onClose={() => setShowSvsModal(false)} />}
    </div>
  );
};

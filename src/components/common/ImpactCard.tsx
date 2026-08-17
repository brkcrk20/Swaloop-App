import React, { useState } from 'react';
import { EnvironmentalImpact } from '../../types';
import { Leaf, Droplets, Zap, Box, Info, Sparkles } from 'lucide-react';
import { SvsExplanationModal } from './SvsExplanationModal';

interface ImpactCardProps {
  impact: EnvironmentalImpact;
  variant?: 'banner' | 'compact' | 'detailed';
  title?: string;
  className?: string;
  showDetailsButton?: boolean;
}

export const ImpactCard: React.FC<ImpactCardProps> = ({
  impact,
  variant = 'banner',
  title = 'Bu takasın tahmini çevresel etkisi',
  className = '',
  showDetailsButton = true,
}) => {
  const [showModal, setShowModal] = useState(false);

  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold ${className}`}
      >
        <Leaf className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>{impact.co2eKg} kg CO₂e</span>
        <span className="text-emerald-500 font-normal">önlenmesine katkı</span>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <>
        <div
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white p-5 shadow-sm ${className}`}
        >
          {/* Subtle nature leaf background pattern */}
          <div className="absolute right-3 -bottom-4 opacity-15 pointer-events-none">
            <svg width="140" height="140" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
            </svg>
          </div>

          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-700/60 border border-emerald-500/30 text-emerald-200 text-xs font-medium backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Bugün Çevreye Katkın</span>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="p-1 rounded-full text-emerald-300 hover:text-white hover:bg-emerald-700/50 transition-colors"
                title="SVS Metodolojisi"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>

            <div className="my-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display text-white">
                  {impact.co2eKg} kg
                </span>
                <span className="text-sm sm:text-base font-semibold text-emerald-200">CO₂e</span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100/90 mt-0.5">
                yeni üretim emisyonunun önlenmesine katkı sağladın.
              </p>
            </div>

            {showDetailsButton && (
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300 hover:text-amber-200 transition-colors self-start group cursor-pointer"
              >
                <span>Detayları ve Metodolojiyi Gör</span>
                <span className="transform group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
            )}
          </div>
        </div>

        {showModal && <SvsExplanationModal onClose={() => setShowModal(false)} />}
      </>
    );
  }

  return (
    <>
      <div
        className={`rounded-2xl bg-stone-50 border border-stone-200/90 p-4 transition-all ${className}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Leaf className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">{title}</h4>
              <p className="text-[11px] text-stone-500">
                Tahmini LCA sürdürülebilirlik göstergeleri
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="text-stone-400 hover:text-stone-700 p-1 transition-colors"
            title="SVS Bilgi"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-2.5 rounded-xl bg-white border border-stone-200/80 flex flex-col">
            <div className="flex items-center gap-1.5 text-stone-500 text-xs mb-1">
              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
              <span>CO₂e Önleme</span>
            </div>
            <span className="text-base font-bold text-emerald-950 font-display">
              {impact.co2eKg} kg
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-stone-200/80 flex flex-col">
            <div className="flex items-center gap-1.5 text-stone-500 text-xs mb-1">
              <Droplets className="w-3.5 h-3.5 text-sky-600" />
              <span>Su Tasarrufu</span>
            </div>
            <span className="text-base font-bold text-emerald-950 font-display">
              {impact.waterLiters} L
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-stone-200/80 flex flex-col">
            <div className="flex items-center gap-1.5 text-stone-500 text-xs mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Enerji</span>
            </div>
            <span className="text-base font-bold text-emerald-950 font-display">
              {impact.energyKwh} kWh
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-stone-200/80 flex flex-col">
            <div className="flex items-center gap-1.5 text-stone-500 text-xs mb-1">
              <Box className="w-3.5 h-3.5 text-stone-600" />
              <span>Hammadde</span>
            </div>
            <span className="text-base font-bold text-emerald-950 font-display">
              {impact.rawMaterialKg} kg
            </span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-500">
          <span>* Değerler tahmini LCA metodolojisine dayanır.</span>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="text-emerald-700 font-semibold hover:underline"
          >
            Metodoloji Bilgisi
          </button>
        </div>
      </div>

      {showModal && <SvsExplanationModal onClose={() => setShowModal(false)} />}
    </>
  );
};

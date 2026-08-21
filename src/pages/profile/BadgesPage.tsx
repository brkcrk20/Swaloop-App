import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, useAuthUser } from '../../context/AppContext';
import { INITIAL_BADGES } from '../../constants';
import { Badge } from '../../types';
import {
  ArrowLeft,
  Award,
  ChevronDown,
  Lock,
  Sparkles,
  ShieldCheck,
  Leaf,
  Repeat,
  Trophy,
  CheckCircle2,
} from 'lucide-react';

export const BadgesPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useAuthUser();
  const [filterCategory, setFilterCategory] = useState<'all' | 'unlocked' | 'locked'>('all');

  // List of badges from mockup and constants
  const badgesList = [
    {
      id: 'badge-first-trade',
      name: 'İlk Takasım',
      description: 'İlk takasını başarıyla tamamladın.',
      category: 'trade',
      iconUrl: '🏅',
      isUnlocked: true,
      unlockedAt: '12 Mayıs 2024',
      co2eRequiredKg: 0,
    },
    {
      id: 'badge-trust-score',
      name: 'Güvenilir Üye',
      description: "Trust Score'un 4.5'i geçti.",
      category: 'trust',
      iconUrl: '🛡️',
      isUnlocked: true,
      unlockedAt: '15 Mayıs 2024',
      co2eRequiredKg: 0,
    },
    {
      id: 'badge-eco-friendly',
      name: 'Çevre Dostu',
      description: '50 kg CO₂e etkisine ulaştın.',
      category: 'eco',
      iconUrl: '🍃',
      isUnlocked: true,
      unlockedAt: '18 Mayıs 2024',
      co2eRequiredKg: 50,
    },
    {
      id: 'badge-loop-pioneer',
      name: 'Loop Pioneer',
      description: 'İlk loop (3+ çoklu) takasını tamamladın.',
      category: 'loop',
      iconUrl: '🔁',
      isUnlocked: true,
      unlockedAt: '20 Mayıs 2024',
      co2eRequiredKg: 0,
    },
    {
      id: 'badge-trade-master',
      name: 'Takas Ustası',
      description: '10 başarılı takası tamamladın.',
      category: 'trade',
      iconUrl: '⭐',
      isUnlocked: false,
      progress: '7/10',
      co2eRequiredKg: 0,
    },
    {
      id: 'badge-water-saver',
      name: 'Su Koruyucusu',
      description: '10.000 Litre sanal su tasarrufuna ulaştın.',
      category: 'eco',
      iconUrl: '💧',
      isUnlocked: false,
      progress: '4.820 / 10.000 L',
      co2eRequiredKg: 0,
    },
    {
      id: 'badge-zero-waste',
      name: 'Sıfır Atık Şampiyonu',
      description: '50 kg hammadde ve atık oluşumunu önledin.',
      category: 'eco',
      iconUrl: '🌱',
      isUnlocked: false,
      progress: '18 / 50 kg',
      co2eRequiredKg: 0,
    },
    {
      id: 'badge-paperclip-hero',
      name: 'Ataş Ustası',
      description: 'Kırmızı ataş yolculuğunda 4. seviyeye ulaştın.',
      category: 'loop',
      iconUrl: '📎',
      isUnlocked: false,
      progress: 'Seviye 2 / 5',
      co2eRequiredKg: 0,
    },
  ];

  const filteredBadges = badgesList.filter((b) => {
    if (filterCategory === 'unlocked') return b.isUnlocked;
    if (filterCategory === 'locked') return !b.isUnlocked;
    return true;
  });

  return (
    <div className="min-h-screen bg-stone-50 pb-24 text-stone-900">
      <div className="max-w-md md:max-w-xl mx-auto px-4 pt-4 space-y-4">
        {/* Top Header Matching Screen 14 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-2xl bg-white border border-stone-200 text-stone-700 flex items-center justify-center hover:bg-stone-100 transition-colors shadow-xs"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-extrabold text-stone-900 font-display">Rozetlerim</h1>
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as any)}
              className="appearance-none bg-white border border-stone-200/90 text-stone-800 text-xs font-bold py-2 pl-3.5 pr-8 rounded-2xl focus:outline-hidden focus:border-emerald-600 shadow-xs cursor-pointer"
            >
              <option value="all">Tümü</option>
              <option value="unlocked">Kazanılanlar ({badgesList.filter((b) => b.isUnlocked).length})</option>
              <option value="locked">Hedefler ({badgesList.filter((b) => !b.isUnlocked).length})</option>
            </select>
            <ChevronDown className="w-4 h-4 text-stone-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Badges List Matching Screen 14 layout */}
        <div className="space-y-2.5 pt-2">
          {filteredBadges.map((badge) => (
            <div
              key={badge.id}
              className={`p-4 rounded-2xl border transition-all flex items-center gap-4 ${
                badge.isUnlocked
                  ? 'bg-white border-stone-200/90 shadow-xs hover:border-emerald-300'
                  : 'bg-stone-100/70 border-stone-200/60 opacity-75'
              }`}
            >
              {/* Badge Circular Icon */}
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-xs border ${
                  badge.isUnlocked
                    ? 'bg-emerald-50/80 border-emerald-200/80 text-emerald-800 ring-2 ring-emerald-600/10'
                    : 'bg-stone-200/80 border-stone-300 text-stone-400 grayscale'
                }`}
              >
                {badge.iconUrl}
              </div>

              {/* Badge Text Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3
                    className={`text-sm font-bold truncate ${
                      badge.isUnlocked ? 'text-stone-900' : 'text-stone-600'
                    }`}
                  >
                    {badge.name}
                  </h3>
                  {badge.isUnlocked ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                      <CheckCircle2 className="w-3 h-3" />
                      Kazanıldı
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-500 bg-stone-200/60 px-2 py-0.5 rounded-full">
                      <Lock className="w-3 h-3" />
                      {badge.progress || 'Kilitli'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 mt-0.5 leading-snug">
                  {badge.description}
                </p>
                {badge.isUnlocked && badge.unlockedAt && (
                  <span className="text-[10px] text-stone-400 block mt-1">
                    Kazanılma Tarihi: {badge.unlockedAt}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

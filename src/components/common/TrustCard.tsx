import React from 'react';
import { TrustProfile } from '../../types';
import { ShieldCheck, CheckCircle2, Clock, ThumbsUp, Star, Award } from 'lucide-react';

interface TrustCardProps {
  trustProfile?: TrustProfile;
  profile?: TrustProfile;
  userName?: string;
  className?: string;
  variant?: 'compact' | 'full';
}

export const TrustCard: React.FC<TrustCardProps> = ({
  trustProfile: rawTrustProfile,
  profile: rawProfile,
  userName = 'Kullanıcı',
  className = '',
  variant = 'full',
}) => {
  const profileData = rawTrustProfile || rawProfile;
  const trustProfile: TrustProfile = {
    score: profileData?.score ?? 4.8,
    level: profileData?.level ?? 'Doğrulanmış Üye',
    phoneVerified: profileData?.phoneVerified ?? true,
    idVerified: profileData?.idVerified ?? false,
    successfulTradesCount: profileData?.successfulTradesCount ?? 14,
    cancellationRate: profileData?.cancellationRate ?? 0.02,
    responseRate: profileData?.responseRate ?? 0.98,
    averageRating: profileData?.averageRating ?? 4.9,
    reviewCount: profileData?.reviewCount ?? 12,
    reportCount: profileData?.reportCount ?? 0,
    accountAgeDays: profileData?.accountAgeDays ?? 120,
    positiveHighlights: profileData?.positiveHighlights ?? [
      'Zamanında Teslim',
      'Ürün Açıklamayla Uyumlu',
      'Hızlı İletişim',
    ],
  };
  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold ${className}`}
        title={`Trust Score: ${trustProfile.score.toFixed(2)} (${trustProfile.level})`}
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>{trustProfile.score.toFixed(2)}</span>
        <span className="text-emerald-700 font-normal text-[11px]">• {trustProfile.level}</span>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl bg-white border border-stone-200/90 p-4 shadow-xs ${className}`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-stone-900">Trust Score</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-100/80 text-emerald-800 text-[10px] font-bold">
                {trustProfile.level}
              </span>
            </div>
            <p className="text-[11px] text-stone-500">Güvenilirlik ve işlem geçmişi karnesi</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-extrabold text-emerald-800 font-display">
            {trustProfile.score.toFixed(2)}
            <span className="text-xs text-stone-400 font-normal"> / 5.0</span>
          </div>
          <div className="flex items-center gap-0.5 justify-end text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="w-3 h-3 fill-current"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Explanatory metrics breakdown */}
      <div className="grid grid-cols-2 gap-2 my-3 text-xs">
        <div className="p-2 rounded-xl bg-stone-50 border border-stone-100 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <span className="text-stone-500 text-[10px] block">Doğrulanmış Telefon</span>
            <span className="font-semibold text-stone-800">
              {trustProfile.phoneVerified ? 'Doğrulandı' : 'Bekleniyor'}
            </span>
          </div>
        </div>

        <div className="p-2 rounded-xl bg-stone-50 border border-stone-100 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-600 shrink-0" />
          <div>
            <span className="text-stone-500 text-[10px] block">Başarılı Takas</span>
            <span className="font-semibold text-stone-800">
              {trustProfile.successfulTradesCount} Takas
            </span>
          </div>
        </div>

        <div className="p-2 rounded-xl bg-stone-50 border border-stone-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky-600 shrink-0" />
          <div>
            <span className="text-stone-500 text-[10px] block">Yanıt Oranı</span>
            <span className="font-semibold text-stone-800">
              %{Math.round(trustProfile.responseRate * 100)}
            </span>
          </div>
        </div>

        <div className="p-2 rounded-xl bg-stone-50 border border-stone-100 flex items-center gap-2">
          <ThumbsUp className="w-4 h-4 text-indigo-600 shrink-0" />
          <div>
            <span className="text-stone-500 text-[10px] block">İptal Oranı</span>
            <span className="font-semibold text-stone-800">
              %{Math.round(trustProfile.cancellationRate * 100)}
            </span>
          </div>
        </div>
      </div>

      {trustProfile.positiveHighlights.length > 0 && (
        <div className="pt-2 border-t border-stone-100">
          <span className="text-[11px] font-semibold text-stone-500 block mb-1.5">
            Öne Çıkan Geri Bildirimler:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {trustProfile.positiveHighlights.map((hl, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-[11px]"
              >
                ✓ {hl}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { listingService } from '../../services/listingService';
import { tradeService } from '../../services/tradeService';
import { Listing, Review } from '../../types';
import { ProductCard } from '../../components/common/ProductCard';
import { ImpactCard } from '../../components/common/ImpactCard';
import { TrustCard } from '../../components/common/TrustCard';
import { SvsExplanationModal } from '../../components/common/SvsExplanationModal';
import { BADGES_LIST } from '../../data/mockData';
import {
  ShieldCheck,
  Award,
  Leaf,
  Droplets,
  Zap,
  Repeat,
  MapPin,
  Calendar,
  Settings,
  Edit3,
  Share2,
  ChevronRight,
  Star,
  CheckCircle,
  ExternalLink,
  Plus,
  Moon,
  Sun,
  Globe,
  Check,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    showToast,
    language,
    setLanguage,
    theme,
    setTheme,
    toggleTheme,
    t,
  } = useApp();
  const [activeTab, setActiveTab] = useState<'listings' | 'impact' | 'badges' | 'reviews'>('listings');
  const [showSvsModal, setShowSvsModal] = useState(false);

  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [myReviews, setMyReviews] = useState<Review[]>([]);

  useEffect(() => {
    listingService.getUserListings(currentUser.id).then(setMyListings);
    tradeService.getReviewsForUser(currentUser.id).then(setMyReviews);
  }, [currentUser.id]);

  const handleShareProfile = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast('Profil Bağlantısı Kopyalandı', 'Profilinizi sosyal medyada paylaşabilirsiniz.', 'success');
  };

  const handleLanguageChange = (lang: 'tr' | 'en') => {
    setLanguage(lang);
    showToast(
      lang === 'en' ? 'Language Changed' : 'Dil Değiştirildi',
      lang === 'en' ? 'App language set to English' : 'Uygulama dili Türkçe olarak ayarlandı',
      'info'
    );
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    showToast(
      newTheme === 'dark' ? 'Karanlık Mod Açıldı' : 'Aydınlık Mod Açıldı',
      newTheme === 'dark' ? 'Gözleri yormayan gece teması uygulandı' : 'Standart aydınlık tema uygulandı',
      'info'
    );
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 pb-28 text-stone-900 dark:text-stone-100 transition-colors">
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 pt-4 space-y-4">
        {/* Profile Card Header */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 p-5 shadow-xs relative overflow-hidden transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.fullName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-emerald-700 shadow-sm"
                />
                {currentUser.isVerified && (
                  <span className="absolute bottom-0 right-0 p-1 rounded-full bg-emerald-700 text-white ring-2 ring-white dark:ring-stone-900">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-stone-900 dark:text-white">{currentUser.fullName}</h1>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                    {currentUser.trustProfile?.level || 'Doğrulanmış Üye'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-stone-400" />
                    {currentUser.district}, {currentUser.city}
                  </span>
                  <span>•</span>
                  <span>{currentUser.memberSince}'den beri üye</span>
                </div>
                <div className="text-[11px] text-stone-400 dark:text-stone-500 font-mono mt-0.5">
                  {currentUser.phone} (Doğrulanmış)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleShareProfile}
                className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                title="Profili Paylaş"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/profil/duzenle')}
                className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
                title="Profili Düzenle"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {currentUser.bio && (
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed mt-3.5 pt-3 border-t border-stone-100 dark:border-stone-800">
              "{currentUser.bio}"
            </p>
          )}

          {/* Quick Stat Counters */}
          <div className="grid grid-cols-4 gap-2 pt-4 mt-3 border-t border-stone-100 dark:border-stone-800 text-center">
            <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60">
              <span className="text-base font-extrabold text-stone-900 dark:text-white block">{myListings.length}</span>
              <span className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">İlanlar</span>
            </div>
            <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60">
              <span className="text-base font-extrabold text-emerald-800 dark:text-emerald-400 block">
                {currentUser.stats.totalTrades}
              </span>
              <span className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">Başarılı Takas</span>
            </div>
            <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60">
              <span className="text-base font-extrabold text-emerald-800 dark:text-emerald-400 block">
                {(currentUser.trustProfile?.score ?? 4.8).toFixed(2)}
              </span>
              <span className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">Güven Skoru</span>
            </div>
            <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60">
              <span className="text-base font-extrabold text-teal-800 dark:text-teal-400 block">
                %{currentUser.stats.responseRatePercent}
              </span>
              <span className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">Yanıt Oranı</span>
            </div>
          </div>
        </div>

        {/* Highlighted SVS Total Environmental Impact Banner */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white rounded-3xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <Leaf className="w-4 h-4 text-emerald-300" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
                  Kişisel SVS Çevresel Etkiniz
                </h3>
                <p className="text-[10px] text-emerald-100/70">Dolaşıma kattığınız eşyaların toplam tasarrufu</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/etkim')}
              className="text-[11px] font-bold text-emerald-300 hover:text-white flex items-center gap-0.5 cursor-pointer"
            >
              <span>Detaylı Rapor</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10">
              <span className="text-[10px] text-emerald-200 block">Engellenen Karbon</span>
              <span className="text-lg font-black text-white">
                {currentUser.stats.totalCo2Prevented} kg
              </span>
              <span className="text-[9px] text-emerald-300 block">CO₂e</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10">
              <span className="text-[10px] text-cyan-200 block">Kurtarılan Su</span>
              <span className="text-lg font-black text-white">
                {currentUser.stats.totalWaterSaved} L
              </span>
              <span className="text-[9px] text-cyan-300 block">Sanal Su</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10">
              <span className="text-[10px] text-amber-200 block">Korunan Enerji</span>
              <span className="text-lg font-black text-white">
                {currentUser.stats.totalEnergySaved} kWh
              </span>
              <span className="text-[9px] text-amber-300 block">Tasarruf</span>
            </div>
          </div>
        </div>

        {/* SVS Environmental Impact Today Banner */}
        <ImpactCard
          impact={{
            co2eKg: 12.4,
            waterLiters: 320,
            energyKwh: 45,
            rawMaterialKg: 2.1,
            wasteReductionKg: 1.8,
            reuseCount: 1,
            methodologyVersion: 'SVS-v2.1',
          }}
          variant="banner"
        />

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-200/60 dark:bg-stone-800 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('listings')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'listings' ? 'bg-white dark:bg-stone-700 text-emerald-900 dark:text-emerald-300 shadow-xs' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            {language === 'en' ? 'My Listings' : 'İlanlarım'} ({myListings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('badges')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'badges' ? 'bg-white dark:bg-stone-700 text-emerald-900 dark:text-emerald-300 shadow-xs' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            {language === 'en' ? 'Badges' : 'Rozetler'} ({BADGES_LIST.filter((b) => b.isEarned).length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'reviews' ? 'bg-white dark:bg-stone-700 text-emerald-900 dark:text-emerald-300 shadow-xs' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            {language === 'en' ? 'Reviews' : 'Yorumlar'} ({myReviews.length})
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'listings' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
                {language === 'en' ? 'Active & Past Listings' : 'Aktif ve Geçmiş İlanlar'}
              </h2>
              <button
                type="button"
                onClick={() => navigate('/ilan-ver')}
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'en' ? 'New Listing' : 'Yeni İlan'}</span>
              </button>
            </div>

            {myListings.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {myListings.map((listing) => (
                  <ProductCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
                <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
                  {language === 'en' ? 'You do not have any listings yet.' : 'Henüz ilanınız bulunmuyor.'}
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/ilan-ver')}
                  className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold"
                >
                  {language === 'en' ? 'Post First Listing' : 'İlk İlanını Ver'}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'badges' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {BADGES_LIST.map((badge) => (
              <div
                key={badge.id}
                className={`p-3.5 rounded-2xl border text-center transition-all ${
                  badge.isEarned
                    ? 'bg-white dark:bg-stone-900 border-emerald-300 dark:border-emerald-700/60 shadow-xs'
                    : 'bg-stone-100/70 dark:bg-stone-800/40 border-stone-200 dark:border-stone-800 opacity-60'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 text-xl ${
                    badge.isEarned ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' : 'bg-stone-200 dark:bg-stone-700 text-stone-400'
                  }`}
                >
                  <Award className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-stone-900 dark:text-white line-clamp-1">{badge.title}</h4>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">{badge.description}</p>
                {badge.isEarned ? (
                  <span className="inline-block mt-2 text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full">
                    {language === 'en' ? 'Earned' : 'Kazanıldı'}
                  </span>
                ) : (
                  <div className="mt-2 w-full bg-stone-200 dark:bg-stone-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full"
                      style={{ width: `${badge.progressPercent}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-2.5">
            {myReviews.length > 0 ? (
              myReviews.map((rev) => (
                <div key={rev.id} className="p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/90 dark:border-stone-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={rev.authorAvatar}
                        alt={rev.authorName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <span className="text-xs font-bold text-stone-900 dark:text-white">{rev.authorName}</span>
                        <span className="text-[10px] text-stone-400 block">{rev.createdAt}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[...Array(rev.overallRating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">"{rev.comment}"</p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {language === 'en' ? 'No reviews yet. Completed trades will be listed here.' : 'Henüz bir değerlendirme bulunmuyor. Takas tamamlandıkça burada listelenecektir.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Trust Profile & Verification Highlights */}
        <TrustCard profile={currentUser.trustProfile} />

        {/* App & Display Preferences: Language & Dark Mode (Compact Segmented Switchers) */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/90 dark:border-stone-800 p-3.5 shadow-xs transition-colors">
          <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <h3 className="text-xs font-bold tracking-tight text-stone-900 dark:text-white">
                {t('profile_preferences')}
              </h3>
            </div>
            <span className="text-[10px] font-medium text-stone-400">
              v1.2
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Dil Seçeneği (Language Segmented Switcher) */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 dark:bg-stone-800/70 border border-stone-200/80 dark:border-stone-700/60">
              <div className="flex items-center gap-1.5 min-w-0 pr-2">
                <Globe className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 truncate">
                  {t('profile_language')}
                </span>
              </div>

              {/* Compact segmented control */}
              <div className="inline-flex p-0.5 rounded-lg bg-stone-200/80 dark:bg-stone-900 shrink-0">
                <button
                  type="button"
                  onClick={() => handleLanguageChange('tr')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    language === 'tr'
                      ? 'bg-white dark:bg-emerald-800 text-stone-900 dark:text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  🇹🇷 TR
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('en')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    language === 'en'
                      ? 'bg-white dark:bg-emerald-800 text-stone-900 dark:text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  🇬🇧 EN
                </button>
              </div>
            </div>

            {/* Karanlık Mod (Dark Mode Segmented Switcher) */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 dark:bg-stone-800/70 border border-stone-200/80 dark:border-stone-700/60">
              <div className="flex items-center gap-1.5 min-w-0 pr-2">
                {theme === 'dark' ? (
                  <Moon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                )}
                <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 truncate">
                  {t('profile_theme')}
                </span>
              </div>

              {/* Compact segmented control */}
              <div className="inline-flex p-0.5 rounded-lg bg-stone-200/80 dark:bg-stone-900 shrink-0">
                <button
                  type="button"
                  onClick={() => handleThemeChange('light')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                    theme === 'light'
                      ? 'bg-white dark:bg-emerald-800 text-stone-900 dark:text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                  title="Aydınlık"
                >
                  <Sun className="w-3 h-3 text-amber-500" />
                  <span>{t('profile_light')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleThemeChange('dark')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                    theme === 'dark'
                      ? 'bg-white dark:bg-emerald-800 text-stone-900 dark:text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                  title="Karanlık"
                >
                  <Moon className="w-3 h-3 text-amber-400" />
                  <span>{t('profile_dark')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom utility links */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/90 dark:border-stone-800 divide-y divide-stone-100 dark:divide-stone-800 overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => navigate('/rozetlerim')}
            className="w-full p-3.5 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors text-xs font-semibold text-stone-800 dark:text-stone-200 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">🏅</span>
              <span>{language === 'en' ? 'My Badges' : 'Rozetlerim'} ({BADGES_LIST.filter((b) => b.isEarned).length} {language === 'en' ? 'Earned' : 'Kazanıldı'})</span>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/etkim')}
            className="w-full p-3.5 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors text-xs font-semibold text-stone-800 dark:text-stone-200 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Leaf className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>{language === 'en' ? 'SVS Carbon & Water Footprint Report' : 'SVS Karbon & Su Ayak İzi Raporum'}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/takas-yolculugum')}
            className="w-full p-3.5 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors text-xs font-semibold text-stone-800 dark:text-stone-200 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">📈</span>
              <span>{language === 'en' ? 'Trade Journey (Upgrade Ladder)' : 'Takas Yolculuğum (Basamak Yükseltme)'}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/mystery-swap')}
            className="w-full p-3.5 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors text-xs font-semibold text-stone-800 dark:text-stone-200 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">🎁</span>
              <span>Mystery Swap ({language === 'en' ? 'Mystery Box' : 'Gizemli Kutu'})</span>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/etkinlikler')}
            className="w-full p-3.5 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors text-xs font-semibold text-stone-800 dark:text-stone-200 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>{language === 'en' ? 'Swap Events & Meetups' : 'Takas Buluşmaları & Etkinlikler'}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/hakkimizda')}
            className="w-full p-3.5 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors text-xs font-semibold text-stone-800 dark:text-stone-200 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Award className="w-4 h-4 text-teal-700 dark:text-teal-400" />
              <span>{language === 'en' ? 'Swaloop Principles & Why No Cash?' : 'Swaloop İlkeleri & Neden Para Yok?'}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="w-full p-3.5 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors text-xs font-semibold text-stone-800 dark:text-stone-200 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-stone-900 dark:text-stone-300" />
              <span>{language === 'en' ? 'Admin & Moderation Panel' : 'Admin & Moderasyon Paneli'}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </button>
        </div>
      </div>

      {showSvsModal && <SvsExplanationModal onClose={() => setShowSvsModal(false)} />}
    </div>
  );
};

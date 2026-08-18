import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { listingService } from '../../services/listingService';
import { CATEGORIES } from '../../constants';
import { ProductCard } from '../../components/common/ProductCard';
import { CircularExchangeIcon } from '../../components/common/SwaloopLogo';
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  ArrowRight,
  Gift,
  Paperclip,
  Users,
  Repeat,
  Radio,
} from 'lucide-react';

export const DiscoverPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentLocation, language, t } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [allListings, setAllListings] = useState<any[]>([]);

  useEffect(() => {
  const loadListings = async () => {
    try {
      const listings = await listingService.getAllListings();
      setAllListings(listings);
    } catch (error) {
      console.error('İlanlar yüklenemedi:', error);
      setAllListings([]);
    }
  };

  loadListings();
}, []);

  const filteredListings = allListings.filter((item) => {
    if (
      selectedCategory !== 'all' &&
      item.categoryId !== selectedCategory
    ) {
      return false;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();

      return (
        (item.title || '').toLowerCase().includes(query) ||
        (item.lookingFor || '').toLowerCase().includes(query) ||
        (item.description || '').toLowerCase().includes(query)
      );
    }

    return true;
  });

  const nearbyListings = allListings.filter(
    (listing) => (listing.location?.distanceKm || 0) <= 2.5
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (searchQuery.trim()) {
      navigate(`/arama?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 pb-24 text-stone-900 dark:text-stone-100 transition-colors">
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 pt-3 space-y-4">

        {/* Search */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('discover_search_placeholder')}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 focus:border-emerald-600 focus:outline-hidden text-xs sm:text-sm font-medium shadow-xs text-stone-900 dark:text-white placeholder-stone-400"
            />
          </div>

          <button
            type="button"
            onClick={() => navigate('/arama')}
            className="w-10 h-10 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors shrink-0 shadow-xs cursor-pointer"
            title="Filtreler"
          >
            <SlidersHorizontal className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
          </button>
        </form>

        {/* Quick Modes */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => navigate('/eslesme')}
            className="p-3 bg-gradient-to-r from-stone-900 via-stone-800 to-emerald-950 text-white rounded-2xl border border-emerald-500/30 flex items-center justify-between shadow-xs hover:border-emerald-400 transition-all cursor-pointer text-left group"
          >
            <div className="min-w-0 pr-1">
              <span className="text-xs font-bold text-white block truncate">
                {t('discover_match_feed')} 🔥
              </span>

              <span className="text-[10px] text-amber-400 font-semibold block truncate">
                {t('discover_swipe_match')}
              </span>
            </div>

            <div className="w-7 h-7 rounded-xl bg-emerald-800/80 flex items-center justify-center text-white shrink-0">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/takas-istekleri')}
            className="p-3 bg-white dark:bg-stone-900 text-stone-900 dark:text-white rounded-2xl border border-stone-200/90 dark:border-stone-800 flex items-center justify-between shadow-xs hover:border-emerald-500/60 transition-all cursor-pointer text-left group"
          >
            <div className="min-w-0 pr-1">
              <span className="text-xs font-bold block truncate">
                {t('discover_trade_requests')} 📥
              </span>

              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block truncate">
                {t('discover_incoming_offers')}
              </span>
            </div>

            <div className="w-7 h-7 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0">
              <Repeat className="w-3.5 h-3.5 text-emerald-800 dark:text-emerald-400" />
            </div>
          </button>
        </div>

        {/* Categories */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              {t('discover_categories')}
            </h3>

            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 cursor-pointer"
            >
              {t('discover_all')}
            </button>
          </div>

          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-emerald-800 text-white'
                  : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800'
              }`}
            >
              🌟 {t('discover_all')}
            </button>

            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-800 text-white'
                    : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Matches */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />

              <h2 className="text-sm font-bold font-display">
                {t('discover_matches_for_you')}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => navigate('/arama')}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 cursor-pointer"
            >
              {t('discover_see_all')} →
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {filteredListings.slice(0, 4).map((listing) => (
              <ProductCard
                key={listing.id}
                listing={listing}
                variant="grid"
              />
            ))}
          </div>
        </div>

        {/* Nearby */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200/70 dark:border-emerald-800/60 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>

            <div className="min-w-0">
              <h4 className="text-xs font-bold truncate">
                {t('discover_nearby_swaps')}
              </h4>

              <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 truncate">
                {currentLocation.district} ({nearbyListings.length}{' '}
                {language === 'en' ? 'nearby listings' : 'aktif ilan'})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/harita')}
            className="px-3 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-bold shrink-0"
          >
            {t('discover_map_view')}
          </button>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">

          {/* Loop */}
          <div
            onClick={() => navigate('/loop')}
            className="group rounded-2xl bg-emerald-900 text-white p-3.5 cursor-pointer border border-emerald-800 shadow-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="px-2 py-0.5 rounded-full bg-emerald-800 text-amber-300 text-[10px] font-bold">
                {t('discover_loop_badge')}
              </span>

              <CircularExchangeIcon size={22} />
            </div>

            <h3 className="text-sm font-bold">
              {t('discover_loop_title')}
            </h3>

            <p className="text-[11px] text-emerald-100/90 mt-1">
              {t('discover_loop_desc')}
            </p>

            <div className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-amber-300">
              {t('discover_loop_action')}
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Paperclip */}
          <div
            onClick={() => navigate('/takas-yolculugum')}
            className="group rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-300/80 p-3.5 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 text-[10px] font-bold">
                {t('discover_paperclip_badge')}
              </span>

              <Paperclip className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            </div>

            <h3 className="text-sm font-bold">
              {t('discover_paperclip_title')}
            </h3>

            <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-1">
              {t('discover_paperclip_desc')}
            </p>

            <div className="mt-3 text-xs font-bold text-amber-800 dark:text-amber-400">
              {t('discover_paperclip_action')} →
            </div>
          </div>

          {/* Mystery */}
          <div
            onClick={() => navigate('/mystery-swap')}
            className="group rounded-2xl bg-stone-900 text-white p-3.5 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="px-2 py-0.5 rounded-full bg-stone-800 text-amber-300 text-[10px] font-bold">
                {t('discover_mystery_badge')}
              </span>

              <Gift className="w-4 h-4 text-amber-400" />
            </div>

            <h3 className="text-sm font-bold">
              {t('discover_mystery_title')}
            </h3>

            <p className="text-[11px] text-stone-300 mt-1">
              {t('discover_mystery_desc')}
            </p>

            <div className="mt-3 text-xs font-bold text-amber-400">
              {t('discover_mystery_action')} →
            </div>
          </div>

          {/* Community */}
          <div
            onClick={() => navigate('/etkinlikler')}
            className="group rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-3.5 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                {t('discover_community_badge')}
              </span>

              <Users className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            </div>

            <h3 className="text-sm font-bold">
              {t('discover_events_title')}
            </h3>

            <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-1">
              {t('discover_events_desc')}
            </p>

            <div className="mt-3 text-xs font-bold text-emerald-800 dark:text-emerald-400">
              {t('discover_events_action')} →
            </div>
          </div>
        </div>

        {/* All Listings */}
        <div className="pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-2.5">
            {t('discover_all_listings')} ({filteredListings.length})
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {filteredListings.map((listing) => (
              <ProductCard
                key={listing.id}
                listing={listing}
                variant="grid"
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
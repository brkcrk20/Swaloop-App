import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Listing } from '../../types';
import { Heart, MapPin, Star, Leaf } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { listingService } from '../../services/listingService';

interface ProductCardProps {
  listing: Listing;
  className?: string;
  variant?: 'grid' | 'horizontal';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  listing,
  className = '',
  variant = 'grid',
}) => {
  const navigate = useNavigate();
  const { showToast, language, t } = useApp();

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    const isFav = listingService.toggleFavorite(listing.id);
    showToast(
      isFav
        ? (language === 'en' ? 'Added to Favorites' : 'Favorilere Eklendi')
        : (language === 'en' ? 'Removed from Favorites' : 'Favorilerden Çıkarıldı'),
      listing.title,
      'info'
    );
  };

  const getConditionLabel = (cond: Listing['condition']) => {
    if (language === 'en') {
      switch (cond) {
        case 'zero':
          return 'Brand New';
        case 'like_new':
          return 'Like New';
        case 'very_good':
          return 'Very Good';
        case 'good':
          return 'Good';
        case 'acceptable':
          return 'Acceptable';
      }
    }
    switch (cond) {
      case 'zero':
        return 'Sıfır';
      case 'like_new':
        return 'Sıfır Gibi';
      case 'very_good':
        return 'Çok İyi';
      case 'good':
        return 'İyi';
      case 'acceptable':
        return 'Makul';
    }
  };

  if (variant === 'horizontal') {
    return (
      <div
        onClick={() => navigate(`/ilan/${listing.id}`)}
        className={`group bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/90 dark:border-stone-800 overflow-hidden hover:border-emerald-500/40 hover:shadow-md transition-all cursor-pointer flex p-3 gap-3 ${className}`}
      >
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 shrink-0">
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <button
            type="button"
            onClick={handleToggleFavorite}
            className={`absolute top-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-xs transition-colors ${
              listing.isFavorite
                ? 'bg-rose-500 text-white'
                : 'bg-stone-900/40 text-white hover:bg-stone-900/60'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${listing.isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        <div className="flex flex-col justify-between flex-1 min-w-0">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400 mb-1">
              <span className="px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 font-medium">
                {getConditionLabel(listing.condition)}
              </span>
              <span>•</span>
              <span className="truncate">{listing.location.district}</span>
              <span>•</span>
              <span>{listing.location.distanceKm} km</span>
            </div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-white truncate group-hover:text-emerald-800 dark:group-hover:text-emerald-400 transition-colors">
              {listing.title}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-1 mt-0.5">
              <span className="text-stone-400 font-medium">{t('discover_looking_for')}:</span> {listing.lookingFor}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800 mt-1">
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
              <Leaf className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>{listing.estimatedImpact.co2eKg} kg CO₂e</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-stone-700 dark:text-stone-300 font-semibold">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
              <span>{listing.user.trustScore.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => navigate(`/ilan/${listing.id}`)}
      className={`group bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/90 dark:border-stone-800 overflow-hidden hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer flex flex-col ${className}`}
    >
      {/* Image container */}
      <div className="relative aspect-4/3 w-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
        <img
          src={listing.images[0]}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {/* Favorite button */}
        <button
          type="button"
          onClick={handleToggleFavorite}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md shadow-xs transition-all ${
            listing.isFavorite
              ? 'bg-rose-500 text-white shadow-rose-500/20'
              : 'bg-white/85 dark:bg-stone-900/80 text-stone-700 dark:text-stone-200 hover:bg-white dark:hover:bg-stone-800 hover:text-rose-500'
          }`}
        >
          <Heart className={`w-4 h-4 ${listing.isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Condition Tag */}
        <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-stone-900/75 backdrop-blur-sm text-white text-[10px] font-semibold tracking-wide">
          {getConditionLabel(listing.condition)}
        </div>
      </div>

      {/* Info Content */}
      <div className="p-3.5 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1">
            <span className="flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
              <span className="truncate">{listing.location.district}</span>
              <span className="text-stone-400">({listing.location.distanceKm} km)</span>
            </span>
            <div className="flex items-center gap-0.5 text-amber-500 font-semibold text-xs shrink-0">
              <Star className="w-3 h-3 fill-current" />
              <span>{listing.user.trustScore.toFixed(1)}</span>
            </div>
          </div>

          <h3 className="text-sm font-bold text-stone-900 dark:text-white group-hover:text-emerald-800 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
            {listing.title}
          </h3>

          <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-1 mt-1">
            <span className="text-stone-400 font-medium">{t('discover_looking_for')}:</span> {listing.lookingFor}
          </p>
        </div>

        {/* Environmental impact tag (SVS) */}
        <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200/80 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold">
            <Leaf className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{listing.estimatedImpact.co2eKg} kg CO₂e</span>
          </div>

          <span className="text-[11px] text-stone-400 font-medium group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
            {t('btn_view')} →
          </span>
        </div>
      </div>
    </div>
  );
};

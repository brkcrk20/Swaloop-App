import React from 'react';
import { useNavigate } from 'react-router-dom';
import { listingService } from '../../services/listingService';
import { ProductCard } from '../../components/common/ProductCard';
import { ArrowLeft, Heart, Sparkles } from 'lucide-react';

export const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const favoriteListings = listingService.getFavorites();

  return (
    <div className="min-h-screen bg-stone-50 pb-24 text-stone-900">
      <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto px-4 pt-3 space-y-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl bg-white border border-stone-200 text-stone-700 flex items-center justify-center hover:bg-stone-100 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-stone-900 font-display">Favori İlanlarım</h1>
            <p className="text-xs text-stone-500">{favoriteListings.length} kayıtlı ilan</p>
          </div>
        </div>

        {favoriteListings.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 border border-stone-200 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
              <Heart className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">Henüz favori ilan eklemedin</h3>
              <p className="text-xs text-stone-500 max-w-xs mx-auto mt-1">
                İlgini çeken ürünlerdeki kalp ikonuna tıklayarak takas için saklayabilirsin.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/kesfet')}
              className="px-5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-colors"
            >
              İlanları Keşfet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {favoriteListings.map((listing) => (
              <ProductCard key={listing.id} listing={listing} variant="grid" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

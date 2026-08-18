import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { listingService } from '../../services/listingService';
import { CATEGORIES } from '../../constants';
import { ProductCard } from '../../components/common/ProductCard';
import { Search, SlidersHorizontal, ArrowLeft, X, Filter } from 'lucide-react';
import { Listing } from '../../types';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryParam = searchParams.get('q') || '';
  const [query, setQuery] = useState(queryParam);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [maxDistance, setMaxDistance] = useState<number>(25);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setQuery(queryParam);
  }, [queryParam]);

  const [results, setResults] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    listingService
      .searchListings(query, selectedCategory, selectedCondition, maxDistance)
      .then((data) => {
        if (!isCancelled) {
          setResults(data);
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [query, selectedCategory, selectedCondition, maxDistance]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(query ? { q: query } : {});
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24 text-stone-900">
      <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto px-4 pt-3 space-y-4">
        {/* Search header */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl bg-white border border-stone-200 text-stone-700 flex items-center justify-center hover:bg-stone-100 transition-colors shrink-0 shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="İlan veya istenen ürün ara..."
              autoFocus
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white border border-stone-200 focus:border-emerald-600 focus:outline-hidden text-sm font-medium shadow-xs"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSearchParams({});
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-colors shrink-0 shadow-xs cursor-pointer ${
              showFilters || selectedCategory !== 'all' || selectedCondition !== 'all'
                ? 'bg-emerald-800 text-white border-emerald-800'
                : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Drawer / Accordion */}
        {showFilters && (
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm space-y-4 animate-in fade-in zoom-in-98 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                Detaylı Filtreler
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedCondition('all');
                  setMaxDistance(25);
                }}
                className="text-xs text-stone-400 hover:text-emerald-700 font-semibold"
              >
                Sıfırla
              </button>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">Kategori</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                    selectedCategory === 'all'
                      ? 'bg-emerald-800 text-white'
                      : 'bg-stone-100 text-stone-700'
                  }`}
                >
                  Tümü
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                      selectedCategory === cat.id
                        ? 'bg-emerald-800 text-white'
                        : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">Kondisyon</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: 'Tümü' },
                  { id: 'zero', label: 'Sıfır' },
                  { id: 'like_new', label: 'Sıfır Gibi' },
                  { id: 'very_good', label: 'Çok İyi' },
                  { id: 'good', label: 'İyi' },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCondition(c.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                      selectedCondition === c.id
                        ? 'bg-emerald-800 text-white'
                        : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Distance Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-stone-700 mb-1">
                <span>Maksimum Mesafe</span>
                <span className="text-emerald-800">{maxDistance} km</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                className="w-full accent-emerald-700"
              />
            </div>
          </div>
        )}

        {/* Results Stream */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-stone-900">
              {results.length > 0
                ? `${results.length} Takas İlanı Bulundu`
                : 'Sonuç Bulunamadı'}
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-2xl bg-stone-100 animate-pulse" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-stone-200 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                <Search className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-stone-900">
                Henüz sana uygun takas bulunamadı.
              </h3>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                Arama kelimeni değiştirebilir veya filtreleri sıfırlayarak tekrar deneyebilirsin.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSelectedCategory('all');
                  setSelectedCondition('all');
                }}
                className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-colors"
              >
                Tüm İlanları Göster
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {results.map((listing) => (
                <ProductCard key={listing.id} listing={listing} variant="grid" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

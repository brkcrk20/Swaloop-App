import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listingService } from '../../services/listingService';
import { ProductCard } from '../../components/common/ProductCard';
import {
  ArrowLeft,
  MapPin,
  ShieldCheck,
  Navigation,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const NearbyMapPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentLocation } = useApp();
  const allListings = listingService.getAllListings();
  const [selectedSpot, setSelectedSpot] = useState<string | null>(null);
  const [activeRadius, setActiveRadius] = useState<number>(5);

  const safeMeetingSpots = [
    {
      id: 'spot-1',
      name: 'Moda Sahil Güvenli Takas Noktası',
      district: 'Kadıköy',
      address: 'Moda Parkı Girişi, Kadıköy / İstanbul',
      verified: true,
      activeTradesCount: 8,
      coords: { x: 38, y: 44 },
    },
    {
      id: 'spot-2',
      name: 'Beşiktaş İskele Meydanı',
      district: 'Beşiktaş',
      address: 'Şehir Hatları İskelesi Önü',
      verified: true,
      activeTradesCount: 14,
      coords: { x: 62, y: 32 },
    },
    {
      id: 'spot-3',
      name: 'Akasya AVM Topluluk Alanı',
      district: 'Üsküdar',
      address: 'Zemin Kat Metro Çıkışı',
      verified: true,
      activeTradesCount: 5,
      coords: { x: 50, y: 68 },
    },
  ];

  return (
    <div className="min-h-screen bg-stone-50 pb-24 text-stone-900">
      <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto px-4 pt-3 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-2xl bg-white border border-stone-200 text-stone-700 flex items-center justify-center hover:bg-stone-100 transition-colors shadow-xs"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-bold text-stone-900 font-display">
                Yakınımdaki Takas Haritası
              </h1>
              <p className="text-xs text-stone-500">
                {currentLocation.district}, {currentLocation.city} Çevresi
              </p>
            </div>
          </div>

          <div className="flex gap-1 bg-white p-1 rounded-xl border border-stone-200 text-xs font-semibold">
            {[2, 5, 10].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setActiveRadius(r)}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  activeRadius === r
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Map Visual Simulator */}
        <div className="relative w-full h-80 sm:h-96 rounded-3xl overflow-hidden bg-stone-900 border-2 border-stone-800 shadow-lg select-none">
          {/* Topographic grid canvas pattern */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, #10b981 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Central Radar Pulse for User */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 rounded-full border border-emerald-500/20 animate-ping opacity-30" />
            <div className="w-32 h-32 rounded-full border border-emerald-500/40" />
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/80" />
            </div>
          </div>

          {/* Safe Swap Spot Markers */}
          {safeMeetingSpots.map((spot) => (
            <button
              key={spot.id}
              type="button"
              onClick={() => setSelectedSpot(spot.id)}
              style={{ left: `${spot.coords.x}%`, top: `${spot.coords.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group z-20 cursor-pointer"
            >
              <div className="flex flex-col items-center">
                <div className="p-2 rounded-2xl bg-emerald-600 text-white border-2 border-white shadow-xl group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="mt-1 px-2 py-0.5 rounded-full bg-stone-900/90 border border-stone-700 text-white text-[10px] font-bold whitespace-nowrap backdrop-blur-sm">
                  {spot.name.split(' ')[0]}
                </span>
              </div>
            </button>
          ))}

          {/* Nearby Listing Pins */}
          {allListings.slice(0, 5).map((l, i) => {
            const positions = [
              { x: 30, y: 25 },
              { x: 72, y: 60 },
              { x: 22, y: 70 },
              { x: 80, y: 28 },
              { x: 45, y: 75 },
            ];
            const pos = positions[i] || { x: 50, y: 50 };
            return (
              <div
                key={l.id}
                onClick={() => navigate(`/ilan/${l.id}`)}
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white shadow-lg bg-white group-hover:scale-110 transition-transform">
                  <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover" />
                </div>
              </div>
            );
          })}

          {/* Map Controls Floating Overlay */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
            <div className="px-3 py-1.5 rounded-xl bg-stone-950/80 backdrop-blur-md border border-stone-800 text-white text-xs flex items-center gap-1.5 pointer-events-auto">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{safeMeetingSpots.length} Doğrulanmış Güvenli Buluşma Noktası</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-stone-950/80 backdrop-blur-md border border-stone-800 text-white text-xs font-semibold pointer-events-auto">
              {allListings.length} Aktif İlan
            </div>
          </div>
        </div>

        {/* Safe Spot Details Modal / Box if selected */}
        {selectedSpot && (
          <div className="p-4 rounded-2xl bg-emerald-900 text-white border border-emerald-700 shadow-md animate-in slide-in-from-bottom-2">
            {(() => {
              const spot = safeMeetingSpots.find((s) => s.id === selectedSpot);
              if (!spot) return null;
              return (
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-700 text-amber-300 text-[10px] font-bold">
                        Doğrulanmış Güvenli Nokta
                      </span>
                      <span className="text-xs text-emerald-200">
                        {spot.activeTradesCount} aktif takas planlandı
                      </span>
                    </div>
                    <h3 className="text-sm font-bold mt-1 text-white">{spot.name}</h3>
                    <p className="text-xs text-emerald-100/80 mt-0.5">{spot.address}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedSpot(null)}
                    className="text-emerald-300 hover:text-white text-xs font-semibold"
                  >
                    Kapat
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {/* Nearby Users and Listings Matching Screen 15 */}
        <div className="space-y-3 pt-2">
          <h2 className="text-sm font-bold text-stone-900 font-display">
            Yakınımdaki Takaslar ({allListings.length})
          </h2>

          <div className="space-y-2.5">
            {allListings.slice(0, 4).map((listing) => (
              <div
                key={listing.id}
                onClick={() => navigate(`/ilan/${listing.id}`)}
                className="p-3.5 bg-white rounded-2xl border border-stone-200/90 shadow-xs flex items-center justify-between gap-3 hover:border-emerald-500/50 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={listing.user.avatarUrl}
                    alt={listing.user.fullName}
                    className="w-11 h-11 rounded-full object-cover border border-stone-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-stone-900 truncate">
                        {listing.user.fullName}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded shrink-0">
                        ★ {listing.user.trustScore?.toFixed(1) || '4.8'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 truncate mt-0.5 font-medium">
                      {listing.title}
                    </p>
                    <span className="text-[11px] text-stone-400 block">
                      {listing.location.district} • {listing.location.distanceKm} km uzakta
                    </span>
                  </div>
                </div>

                <div className="w-14 h-14 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

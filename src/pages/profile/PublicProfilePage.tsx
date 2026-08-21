import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp, useAuthUser } from '../../context/AppContext';
import { listingService } from '../../services/listingService';
import { tradeService } from '../../services/tradeService';
import { authService } from '../../services/authService';
import { messageService } from '../../services/messageService';
import { ProductCard } from '../../components/common/ProductCard';
import { TrustCard } from '../../components/common/TrustCard';
import { Listing, Review, UserProfile } from '../../types';
import { ArrowLeft, MessageSquare, ShieldCheck, MapPin, Calendar, Star, Leaf, Loader2, UserX } from 'lucide-react';

export const PublicProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { showToast } = useApp();

  const currentUser = useAuthUser();

  // Profil artık mock OTHER_USERS'tan değil, gerçek profiles tablosundan
  // geliyor. Önceden kimlik bulunamazsa listedeki ilk sahte kullanıcı
  // gösteriliyor, ama ilanlar/değerlendirmeler gerçek veritabanından
  // çekiliyordu — ekranda bir kişinin sahte adı, başkasının gerçek
  // ilanlarıyla yan yana duruyordu.
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [userReviews, setUserReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    authService.getPublicProfile(id).then((profile) => {
      if (cancelled) return;
      setUser(profile);
      setIsLoading(false);

      if (profile) {
        listingService.getUserListings(profile.id).then((l) => {
          if (!cancelled) setUserListings(l);
        });
        tradeService.getReviewsForUser(profile.id).then((r) => {
          if (!cancelled) setUserReviews(r);
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div
        className="flex flex-col items-center justify-center py-24 gap-3 text-stone-500"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
        <span className="text-sm">Profil yükleniyor…</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 gap-3 text-center">
        <UserX className="w-10 h-10 text-stone-400" aria-hidden="true" />
        <h1 className="text-lg font-bold text-stone-900">Kullanıcı bulunamadı</h1>
        <p className="text-sm text-stone-500 max-w-sm">
          Bu profil kaldırılmış ya da bağlantı hatalı olabilir.
        </p>
        <button
          type="button"
          onClick={() => navigate('/kesfet')}
          className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition-colors"
        >
          Keşfete dön
        </button>
      </div>
    );
  }

  const handleStartChat = async () => {
    const conv = await messageService.getOrCreateConversationWithUser(currentUser.id, user.id);
    if (conv) {
      navigate(`/mesajlar/${conv.id}`);
    } else {
      showToast('Sohbet açılamadı', 'Lütfen tekrar deneyin.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24 text-stone-900">
      <div className="max-w-md md:max-w-2xl mx-auto px-4 pt-3 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold text-stone-900">Kullanıcı Profili</h1>
        </div>

        {/* User Card */}
        <div className="bg-white rounded-3xl border border-stone-200/90 p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="w-16 h-16 rounded-full object-cover border-2 border-emerald-700"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-stone-900">{user.fullName}</h2>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full">
                    {user.trustProfile?.level || 'Doğrulanmış Üye'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                  <MapPin className="w-3 h-3 text-stone-400" />
                  <span>{user.district}, {user.city}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-0.5">
                  <Calendar className="w-3 h-3 text-stone-400" />
                  <span>{user.memberSince}'den beri üye</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartChat}
              className="p-2.5 rounded-xl bg-emerald-800 text-white hover:bg-emerald-900 transition-colors"
              title="Mesaj Gönder"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>

          {user.bio && (
            <p className="text-xs text-stone-600 leading-relaxed mt-3 pt-3 border-t border-stone-100">
              "{user.bio}"
            </p>
          )}

          {/* SVS Stats */}
          <div className="grid grid-cols-3 gap-2 pt-3 mt-3 border-t border-stone-100 text-center">
            <div className="p-2 rounded-xl bg-stone-50">
              <span className="text-sm font-bold text-emerald-800">
                +{user.stats.totalCo2Prevented} kg
              </span>
              <span className="text-[10px] text-stone-500 block">CO₂e Engellendi</span>
            </div>
            <div className="p-2 rounded-xl bg-stone-50">
              <span className="text-sm font-bold text-stone-900">{user.stats.totalTrades}</span>
              <span className="text-[10px] text-stone-500 block">Tamamlanan Takas</span>
            </div>
            <div className="p-2 rounded-xl bg-stone-50">
              <span className="text-sm font-bold text-emerald-800">
                ★ {(user.trustProfile?.score ?? 4.8).toFixed(1)}
              </span>
              <span className="text-[10px] text-stone-500 block">Güven Skoru</span>
            </div>
          </div>
        </div>

        {/* User's Active Listings */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
            {user.fullName} Kullanıcısının İlanları ({userListings.length})
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {userListings.map((listing) => (
              <ProductCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>

        {/* Trust Profile Breakdown */}
        <TrustCard trustProfile={user.trustProfile} />
      </div>
    </div>
  );
};

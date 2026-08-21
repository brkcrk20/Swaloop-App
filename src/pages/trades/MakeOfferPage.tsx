import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp, useAuthUser } from '../../context/AppContext';
import { listingService } from '../../services/listingService';
import { tradeService } from '../../services/tradeService';
import { impactService } from '../../services/impactService';
import { Listing } from '../../types';
import {
  ArrowLeft,
  ArrowLeftRight,
  ShieldCheck,
  Leaf,
  Droplets,
  Zap,
  MapPin,
  Truck,
  Check,
  Plus,
  Info,
} from 'lucide-react';

export const MakeOfferPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetListingId = searchParams.get('targetId');
  const { showToast } = useApp();
  const currentUser = useAuthUser();

  const [targetListing, setTargetListing] = useState<Listing | undefined>(undefined);
  const [isLoadingTarget, setIsLoadingTarget] = useState(true);
  const [myListings, setMyListings] = useState<Listing[]>([]);

  useEffect(() => {
    setIsLoadingTarget(true);
    const targetPromise = targetListingId
      ? listingService.getListingById(targetListingId)
      : listingService.getAllListings().then((all) => all[0]);

    targetPromise.then((listing) => {
      setTargetListing(listing);
      setIsLoadingTarget(false);
    });

    listingService
      .getUserListings(currentUser.id)
      .then((all) => setMyListings(all.filter((l) => l.status === 'active')));
  }, [targetListingId, currentUser.id]);

  const [selectedMyListingIds, setSelectedMyListingIds] = useState<string[]>([]);

  useEffect(() => {
    if (myListings.length > 0 && selectedMyListingIds.length === 0) {
      setSelectedMyListingIds([myListings[0].id]);
    }
  }, [myListings]);
  const [deliveryMethod, setDeliveryMethod] = useState<'in_person' | 'cargo' | 'safe_point'>('safe_point');
  const [note, setNote] = useState('');
  const [scheduledDate, setScheduledDate] = useState('2024-05-25');
  const [meetingLocation, setMeetingLocation] = useState(
    targetListing?.location?.safeMeetingPoint || 'Kadıköy İskele Meydanı - Güvenli Takas Noktası'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoadingTarget) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-700 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!targetListing) {
    return (
      <div className="min-h-screen bg-stone-50 p-6 flex flex-col items-center justify-center text-center">
        <p className="text-sm font-bold text-stone-700 mb-3">Takas yapılacak ürün bulunamadı.</p>
        <button
          type="button"
          onClick={() => navigate('/kesfet')}
          className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold"
        >
          Keşfet'e Dön
        </button>
      </div>
    );
  }

  const toggleSelectMyListing = (id: string) => {
    if (selectedMyListingIds.includes(id)) {
      if (selectedMyListingIds.length > 1) {
        setSelectedMyListingIds(selectedMyListingIds.filter((item) => item !== id));
      }
    } else {
      setSelectedMyListingIds([...selectedMyListingIds, id]);
    }
  };

  const selectedListings = myListings.filter((l) => selectedMyListingIds.includes(l.id));

  // Combined Environmental Impact Calculation
  const combinedImpact = impactService.calculateCombinedTradeImpact([
    targetListing.estimatedImpact,
    ...selectedListings.map((l) => l.estimatedImpact),
  ]);

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedListings.length === 0) {
      showToast('Lütfen teklif etmek için en az bir ürününüzü seçin.', undefined, 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const newTrade = await tradeService.createTradeOffer({
        initiator: currentUser,
        receiver: {
          id: targetListing.userId,
          fullName: targetListing.user.fullName,
          avatarUrl: targetListing.user.avatarUrl,
          phone: '+90 5XX XXX XX XX',
          city: targetListing.location.city,
          district: targetListing.location.district,
          memberSince: '2024',
          interests: [],
          wantedCategories: [],
          role: 'user',
          isVerified: targetListing.user.isVerified,
          trustProfile: {
            score: targetListing.user.trustScore,
            level: 'Güvenilir',
            phoneVerified: true,
            idVerified: false,
            successfulTradesCount: 4,
            cancellationRate: 0,
            responseRate: 0.98,
            averageRating: 4.8,
            reviewCount: 6,
            reportCount: 0,
            accountAgeDays: 120,
            positiveHighlights: ['İyi iletişim', 'Özenli paketleme'],
          },
          stats: {
            totalTrades: 4,
            activeListings: 2,
            completedLoops: 1,
            totalCo2Prevented: 35.2,
            totalWaterSaved: 850,
            totalEnergySaved: 320,
            totalRawMaterialsSaved: 4.1,
            totalItemsReused: 5,
            responseRatePercent: 98,
            avgResponseTimeMinutes: 15,
            cancellationRatePercent: 0,
          },
        },
        offeredListings: selectedListings,
        requestedListings: [targetListing],
        note,
        deliveryMethod,
        deliveryDetails: {
          scheduledDate,
          locationName: meetingLocation,
        },
      });

      if (!newTrade) {
        showToast('Teklif oluşturulurken bir hata oluştu.', undefined, 'error');
        return;
      }

      showToast('Takas Teklifi Gönderildi!', 'Karşı taraf onayladığında bildirim alacaksınız.', 'success');
      navigate(`/teklif/${newTrade.id}`);
    } catch (err) {
      showToast('Teklif oluşturulurken bir hata oluştu.', undefined, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24 text-stone-900">
      <div className="max-w-md md:max-w-2xl mx-auto px-4 pt-3 space-y-4">
        {/* Top bar */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-stone-900">Takas Teklifi Oluştur</h1>
            <p className="text-xs text-stone-500">Parasal işlem yok • Saf sürdürülebilir takas</p>
          </div>
        </div>

        {/* Target Item Summary Card */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-3.5 flex items-center gap-3">
          <img
            src={targetListing.images[0]}
            alt={targetListing.title}
            className="w-16 h-16 rounded-xl object-cover border border-stone-200 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">İstediğin Ürün</span>
            <h3 className="text-xs font-bold text-stone-900 truncate">{targetListing.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-stone-600 truncate">Sahibi: {targetListing.user.fullName}</span>
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                ★ {targetListing.user.trustScore}
              </span>
            </div>
            <p className="text-[10px] text-stone-500 truncate mt-0.5">
              Aradığı: <span className="font-semibold text-stone-700">{targetListing.lookingFor}</span>
            </p>
          </div>
        </div>

        {/* Select My Items to Offer */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              Karşılığında Vereceğin Ürün(ler)
            </h2>
            <button
              type="button"
              onClick={() => navigate('/ilan-ver')}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Yeni İlan Ekle</span>
            </button>
          </div>

          {myListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {myListings.map((item) => {
                const isSelected = selectedMyListingIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelectMyListing(item.id)}
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-700 bg-emerald-50/50 shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                        isSelected ? 'bg-emerald-800 border-emerald-800 text-white' : 'border-stone-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-12 h-12 rounded-lg object-cover border border-stone-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-stone-800 truncate">{item.title}</h4>
                      <span className="text-[10px] text-emerald-700 font-semibold">
                        +{item.estimatedImpact.co2eKg} kg CO₂e
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
              <p className="text-xs text-amber-900 font-semibold mb-2">Aktif bir ilanınız bulunmuyor.</p>
              <button
                type="button"
                onClick={() => navigate('/ilan-ver')}
                className="px-3 py-1.5 bg-amber-800 text-white text-xs font-bold rounded-lg"
              >
                Hemen İlan Ekle
              </button>
            </div>
          )}
        </div>

        {/* Real-time Environmental Benefit Calculation */}
        <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-950 text-white rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-emerald-300" />
              <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
                Ortak SVS Çevresel Kazanç
              </span>
            </div>
            <span className="text-[10px] bg-emerald-800/80 px-2 py-0.5 rounded-full border border-emerald-600/40 text-emerald-200">
              Gerçek Zamanlı
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
              <div className="flex items-center justify-center gap-1 text-emerald-300 text-xs mb-0.5">
                <Leaf className="w-3.5 h-3.5" />
                <span className="font-bold">CO₂e</span>
              </div>
              <div className="text-base font-extrabold text-white">+{combinedImpact.co2eKg} kg</div>
              <div className="text-[9px] text-emerald-200/80">Karbon Tasarrufu</div>
            </div>

            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
              <div className="flex items-center justify-center gap-1 text-cyan-300 text-xs mb-0.5">
                <Droplets className="w-3.5 h-3.5" />
                <span className="font-bold">Su</span>
              </div>
              <div className="text-base font-extrabold text-white">+{combinedImpact.waterLiters} L</div>
              <div className="text-[9px] text-cyan-200/80">Sanal Su Tasarrufu</div>
            </div>

            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
              <div className="flex items-center justify-center gap-1 text-amber-300 text-xs mb-0.5">
                <Zap className="w-3.5 h-3.5" />
                <span className="font-bold">Enerji</span>
              </div>
              <div className="text-base font-extrabold text-white">+{combinedImpact.energyKwh} kWh</div>
              <div className="text-[9px] text-amber-200/80">Üretim Enerjisi</div>
            </div>
          </div>
        </div>

        {/* Delivery Method Selection */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4 space-y-3">
          <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Teslimat & Buluşma Tercihi</h2>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setDeliveryMethod('safe_point')}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center ${
                deliveryMethod === 'safe_point'
                  ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                  : 'border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              <ShieldCheck className="w-5 h-5 mb-1 text-emerald-700" />
              <span className="text-xs">Güvenli Nokta</span>
              <span className="text-[9px] text-stone-400 font-normal">Metro / AVM</span>
            </button>

            <button
              type="button"
              onClick={() => setDeliveryMethod('in_person')}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center ${
                deliveryMethod === 'in_person'
                  ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                  : 'border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              <MapPin className="w-5 h-5 mb-1 text-teal-700" />
              <span className="text-xs">Yüz Yüze</span>
              <span className="text-[9px] text-stone-400 font-normal">Ortak Konum</span>
            </button>

            <button
              type="button"
              onClick={() => setDeliveryMethod('cargo')}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center ${
                deliveryMethod === 'cargo'
                  ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                  : 'border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              <Truck className="w-5 h-5 mb-1 text-stone-600" />
              <span className="text-xs">Kargo / Dolap</span>
              <span className="text-[9px] text-stone-400 font-normal">Anlaşmalı</span>
            </button>
          </div>

          {/* Location / Note inputs */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-semibold text-stone-700">Önerilen Buluşma Noktası / Detay</label>
            <input
              type="text"
              value={meetingLocation}
              onChange={(e) => setMeetingLocation(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:border-emerald-700 outline-hidden"
              placeholder="Örn: Kadıköy Boğa Heykeli önü veya metro çıkışı"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-stone-700">Kullanıcıya Notunuz (İsteğe bağlı)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:border-emerald-700 outline-hidden resize-none"
              placeholder="Merhaba, ürününüzle ilgileniyorum. Temiz kullandığım ürünümle takas teklif ediyorum..."
            />
          </div>
        </div>

        {/* Submit Offer Button */}
        <button
          type="button"
          onClick={handleSubmitOffer}
          disabled={isSubmitting || selectedListings.length === 0}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>{isSubmitting ? 'Gönderiliyor...' : 'Takas Teklifini İlet'}</span>
        </button>
      </div>
    </div>
  );
};

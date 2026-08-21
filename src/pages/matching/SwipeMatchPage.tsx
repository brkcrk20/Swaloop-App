import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, useAuthUser } from '../../context/AppContext';
import { listingService } from '../../services/listingService';
import { tradeService } from '../../services/tradeService';
import { messageService } from '../../services/messageService';
import { Listing } from '../../types';
import { CATEGORIES } from '../../constants';
import {
  ArrowLeft,
  Heart,
  X,
  Sparkles,
  RotateCcw,
  SlidersHorizontal,
  MapPin,
  ShieldCheck,
  Leaf,
  MessageSquare,
  Repeat,
  Zap,
  Info,
  CheckCircle2,
  ChevronRight,
  Flame,
  Layers,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

export const SwipeMatchPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const currentUser = useAuthUser();

  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [userMyListings, setUserMyListings] = useState<Listing[]>([]);

  useEffect(() => {
    listingService
      .getAllListings()
      .then((all) => setAllListings(all.filter((l) => l.user.id !== currentUser.id)));
    listingService.getUserListings(currentUser.id).then(setUserMyListings);
  }, [currentUser.id]);

  // Match preferences state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [maxDistance, setMaxDistance] = useState<number>(20);
  const [onlyVerified, setOnlyVerified] = useState<boolean>(false);
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [showMatchesDrawer, setShowMatchesDrawer] = useState<boolean>(false);

  // Filtered deck of listings
  const filteredListings = allListings.filter((item) => {
    if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) return false;
    if (item.location.distanceKm > maxDistance) return false;
    if (onlyVerified && !item.user.isVerified) return false;
    return true;
  });

  // Active card index and history for Undo
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [history, setHistory] = useState<{ listing: Listing; action: 'like' | 'pass' | 'super' }[]>([]);
  const [swipedMatches, setSwipedMatches] = useState<Listing[]>([]);

  // Dragging & Swipe state
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const startPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Match Celebration Modal state
  const [matchedItem, setMatchedItem] = useState<{
    targetListing: Listing;
    myListing: Listing;
    matchScore: number;
  } | null>(null);

  const currentListing = filteredListings[currentIndex];
  const defaultMyListing = userMyListings[0] || allListings[0];

  // Helper to calculate match score between target and user's items
  const getMatchAffinity = (target: Listing) => {
    let score = 75;
    if (target.location.distanceKm <= 5) score += 10;
    if (target.user.isVerified) score += 5;
    if (target.estimatedImpact && target.estimatedImpact.co2eKg > 5) score += 5;
    return Math.min(score, 98);
  };

  // Perform Swipe Action
  const handleSwipe = (action: 'like' | 'pass' | 'super') => {
    if (!currentListing) return;

    setHistory((prev) => [...prev, { listing: currentListing, action }]);

    if (action === 'like' || action === 'super') {
      const matchScore = getMatchAffinity(currentListing);

      // Trigger Match Celebration if score is high or user likes
      if (matchScore >= 80 || action === 'super') {
        setSwipedMatches((prev) => [currentListing, ...prev]);
        setMatchedItem({
          targetListing: currentListing,
          myListing: defaultMyListing,
          matchScore: action === 'super' ? 99 : matchScore,
        });
      } else {
        showToast('Takas İsteği Kaydedildi', `${currentListing.title} beğendiklerinize eklendi.`, 'success');
      }
    } else {
      showToast('Pas Geçildi', undefined, 'info');
    }

    setDragOffset({ x: 0, y: 0 });
    setCurrentIndex((prev) => prev + 1);
  };

  // Undo last swipe
  const handleUndo = () => {
    if (history.length === 0 || currentIndex === 0) {
      showToast('Geri alınacak işlem yok', undefined, 'info');
      return;
    }

    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setCurrentIndex((prev) => Math.max(0, prev - 1));

    if (last.action === 'like' || last.action === 'super') {
      setSwipedMatches((prev) => prev.filter((m) => m.id !== last.listing.id));
    }
    showToast('Son kart geri getirildi ↺', undefined, 'info');
  };

  // Touch / Mouse Drag handlers
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    startPos.current = { x: clientX, y: clientY };
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const dx = clientX - startPos.current.x;
    const dy = clientY - startPos.current.y;
    setDragOffset({ x: dx, y: dy });
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (dragOffset.x > 90) {
      handleSwipe('like');
    } else if (dragOffset.x < -90) {
      handleSwipe('pass');
    } else if (dragOffset.y < -90) {
      handleSwipe('super');
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const rotationDeg = dragOffset.x * 0.08;
  const likeOpacity = Math.min(Math.max(dragOffset.x / 80, 0), 1);
  const passOpacity = Math.min(Math.max(-dragOffset.x / 80, 0), 1);
  const superOpacity = Math.min(Math.max(-dragOffset.y / 80, 0), 1);

  return (
    <div className="h-[calc(100dvh-4.5rem)] max-h-[calc(100dvh-4.5rem)] bg-stone-900 text-white flex flex-col justify-between pb-2 select-none overflow-hidden max-w-md md:max-w-lg mx-auto w-full">
      {/* Top Bar */}
      <header className="px-3 pt-2 pb-1 flex items-center justify-between w-full z-20 shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-stone-800 border border-stone-700 text-stone-300 flex items-center justify-center hover:bg-stone-700 transition-colors shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-1">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              <h1 className="text-base font-black text-white tracking-tight font-display">
                Takas Eşleştirme
              </h1>
            </div>
            <span className="text-[10px] text-stone-400 block -mt-0.5">
              Aradığın eşyaları kaydırarak keşfet
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Matches Drawer Badge Button */}
          <button
            type="button"
            onClick={() => setShowMatchesDrawer(true)}
            className="relative p-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
            title="Eşleşmelerim"
          >
            <Repeat className="w-4 h-4 text-emerald-400" />
            {swipedMatches.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 text-stone-950 rounded-full text-[8px] font-black flex items-center justify-center ring-2 ring-stone-900">
                {swipedMatches.length}
              </span>
            )}
          </button>

          {/* Filter Preferences Button */}
          <button
            type="button"
            onClick={() => setShowFilterModal(true)}
            className="p-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
            title="Eşleşme Tercihleri"
          >
            <SlidersHorizontal className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </header>

      {/* Main Card Deck Area */}
      <main className="flex-1 min-h-0 flex items-center justify-center px-3 py-1 relative w-full overflow-hidden">
        {currentListing ? (
          <div
            className="relative w-full h-full max-h-[62vh] sm:max-h-[68vh] rounded-3xl overflow-hidden shadow-2xl bg-stone-800 border border-stone-700/80 cursor-grab active:cursor-grabbing transition-transform flex flex-col justify-between"
            style={{
              transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${rotationDeg}deg)`,
              transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1)',
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleTouchStart}
            onMouseMove={handleTouchMove}
            onMouseUp={handleTouchEnd}
            onMouseLeave={handleTouchEnd}
          >
            {/* Background Image */}
            <img
              src={currentListing.images[0]}
              alt={currentListing.title}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-stone-950/60 via-transparent to-transparent pointer-events-none" />

            {/* Swipe Indicators (LIKE, PASS, SUPER) */}
            {likeOpacity > 0 && (
              <div
                className="absolute top-6 left-4 border-3 border-emerald-400 text-emerald-400 font-black text-xl px-3 py-1 rounded-xl rotate-[-12deg] pointer-events-none z-30 shadow-lg tracking-wider bg-stone-950/40 backdrop-blur-xs"
                style={{ opacity: likeOpacity }}
              >
                TAKAS İSTE 💚
              </div>
            )}
            {passOpacity > 0 && (
              <div
                className="absolute top-6 right-4 border-3 border-rose-500 text-rose-500 font-black text-xl px-3 py-1 rounded-xl rotate-[12deg] pointer-events-none z-30 shadow-lg tracking-wider bg-stone-950/40 backdrop-blur-xs"
                style={{ opacity: passOpacity }}
              >
                PAS GEÇ ❌
              </div>
            )}
            {superOpacity > 0 && (
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-3 border-amber-400 bg-amber-500/20 backdrop-blur-xs text-amber-300 font-black text-xl px-5 py-2 rounded-2xl pointer-events-none z-30 shadow-2xl tracking-wider uppercase text-center"
                style={{ opacity: superOpacity }}
              >
                ⭐ SÜPER TAKAS ⭐
              </div>
            )}

            {/* Top Badges (Category & Distance & Match Score) */}
            <div className="relative top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
              <span className="px-2.5 py-1 rounded-full bg-stone-900/85 backdrop-blur-md text-emerald-300 text-[11px] font-bold border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                %{getMatchAffinity(currentListing)} Uyumluluk
              </span>

              <span className="px-2.5 py-1 rounded-full bg-stone-900/85 backdrop-blur-md text-stone-200 text-[11px] font-medium border border-stone-700 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400" />
                {currentListing.location.district} ({currentListing.location.distanceKm} km)
              </span>
            </div>

            {/* Bottom Info Card */}
            <div className="relative p-3.5 sm:p-4 space-y-2 z-10 pointer-events-auto mt-auto">
              {/* SVS Eco Pill */}
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-emerald-900/90 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                  <Leaf className="w-2.5 h-2.5 text-emerald-400" />
                  {currentListing.estimatedImpact?.co2eKg || 8.4} kg CO₂e
                </span>
                <span className="px-2 py-0.5 rounded-md bg-stone-800/90 border border-stone-700 text-stone-300 text-[10px] font-semibold">
                  {currentListing.condition}
                </span>
              </div>

              {/* Title & SVS Points */}
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-base sm:text-lg font-black text-white leading-tight font-display truncate">
                  {currentListing.title}
                </h2>
                <span className="text-amber-400 font-bold text-xs shrink-0">
                  {currentListing.estimatedImpact?.waterLiters || 240} L Su
                </span>
              </div>

              {/* Aradığı Ürün (Looking For) */}
              <div className="p-2 rounded-xl bg-stone-900/90 backdrop-blur-md border border-stone-700/80 text-[11px] text-stone-300 space-y-0.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 block">
                  Takasta Aradığı Eşyalar:
                </span>
                <p className="font-semibold text-white truncate">{currentListing.lookingFor}</p>
              </div>

              {/* Owner Info & Details Shortcut */}
              <div className="flex items-center justify-between pt-0.5">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/profil/${currentListing.user.id}`);
                  }}
                  className="flex items-center gap-2 cursor-pointer group min-w-0"
                >
                  <img
                    src={currentListing.user.avatarUrl}
                    alt={currentListing.user.fullName}
                    className="w-7 h-7 rounded-full object-cover ring-1.5 ring-emerald-500/50 shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-white group-hover:text-emerald-400 transition-colors block truncate">
                      {currentListing.user.fullName}
                    </span>
                    <span className="text-[9.5px] text-emerald-400 font-semibold flex items-center gap-0.5">
                      ★ {currentListing.user.trustScore?.toFixed(1) || '4.9'} Güven Skoru
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/ilan/${currentListing.id}`);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-bold flex items-center gap-0.5 transition-colors border border-stone-700 cursor-pointer shrink-0"
                >
                  <span>Detay</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Empty Deck State */
          <div className="w-full text-center py-10 px-4 bg-stone-800/60 rounded-3xl border border-stone-700/80 space-y-3">
            <div className="w-12 h-12 rounded-full bg-stone-700/80 flex items-center justify-center mx-auto text-2xl">
              🎯
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white font-display">
                Şimdilik Eşleşme Kalmadı!
              </h3>
              <p className="text-xs text-stone-400 max-w-xs mx-auto">
                Seçtiğin filtrelerdeki tüm ilanları inceledin.
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setMaxDistance(50);
                  setCurrentIndex(0);
                }}
                className="px-3 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Filtreleri Sıfırla
              </button>
              <button
                type="button"
                onClick={() => navigate('/kesfet')}
                className="px-3 py-2 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-200 text-xs font-bold transition-colors cursor-pointer"
              >
                Keşfet'e Dön
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Floating Control Buttons */}
      <footer className="px-3 pt-1 pb-2 flex items-center justify-center gap-3 w-full z-20 shrink-0">
        {/* Undo Button */}
        <button
          type="button"
          onClick={handleUndo}
          disabled={history.length === 0}
          className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
            history.length > 0
              ? 'bg-stone-800 border-stone-700 text-amber-400 hover:bg-stone-700 active:scale-95 cursor-pointer shadow-md'
              : 'bg-stone-900 border-stone-800 text-stone-600 opacity-40 cursor-not-allowed'
          }`}
          title="Geri Al"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Pass Button (Swipe Left) */}
        <button
          type="button"
          onClick={() => handleSwipe('pass')}
          disabled={!currentListing}
          className="w-13 h-13 rounded-full bg-stone-800 border-2 border-rose-500/80 text-rose-400 hover:bg-rose-950/40 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-rose-950/30 flex items-center justify-center cursor-pointer"
          title="Pas Geç"
        >
          <X className="w-7 h-7 stroke-[2.5]" />
        </button>

        {/* Super Swap Button (Swipe Up) */}
        <button
          type="button"
          onClick={() => handleSwipe('super')}
          disabled={!currentListing}
          className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-stone-950 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-amber-500/30 flex items-center justify-center cursor-pointer"
          title="Süper Takas İsteği"
        >
          <Zap className="w-5 h-5 fill-stone-950 stroke-[2.5]" />
        </button>

        {/* Like & Match Button (Swipe Right) */}
        <button
          type="button"
          onClick={() => handleSwipe('like')}
          disabled={!currentListing}
          className="w-13 h-13 rounded-full bg-gradient-to-tr from-emerald-700 to-emerald-500 text-white hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-900/40 flex items-center justify-center cursor-pointer border-2 border-emerald-300"
          title="Takas İste & Eşleş"
        >
          <Heart className="w-7 h-7 fill-white stroke-[1.5]" />
        </button>
      </footer>

      {/* IT'S A MATCH Celebration Modal */}
      {matchedItem && (
        <div className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-stone-900 border border-emerald-500/50 w-full max-w-sm rounded-3xl p-6 text-center space-y-5 shadow-2xl relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-20 -left-20 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-1">
              <span className="text-xs font-black text-amber-400 tracking-widest uppercase flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                KARŞILIKLI EŞLEŞME YAKALANDI!
              </span>
              <h2 className="text-2xl font-black text-white font-display">
                Harika bir Takas Uyumu 🎉
              </h2>
              <p className="text-xs text-stone-300">
                {matchedItem.targetListing.user.fullName} ile eşyalarınız %{matchedItem.matchScore} oranında örtüşüyor.
              </p>
            </div>

            {/* Side-by-Side Items Display */}
            <div className="flex items-center justify-center gap-3 py-2">
              {/* My Item */}
              <div className="flex-1 bg-stone-800 p-2 rounded-2xl border border-stone-700 space-y-1">
                <div className="w-full h-20 rounded-xl overflow-hidden bg-stone-700">
                  <img
                    src={matchedItem.myListing.images[0]}
                    alt={matchedItem.myListing.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[10px] text-emerald-400 font-bold block truncate">
                  Senin: {matchedItem.myListing.title}
                </span>
              </div>

              {/* Animated Exchange Icon */}
              <div className="w-10 h-10 rounded-full bg-emerald-800 border-2 border-emerald-400 flex items-center justify-center text-white shrink-0 shadow-lg animate-pulse">
                <Repeat className="w-5 h-5" />
              </div>

              {/* Target Item */}
              <div className="flex-1 bg-stone-800 p-2 rounded-2xl border border-stone-700 space-y-1">
                <div className="w-full h-20 rounded-xl overflow-hidden bg-stone-700">
                  <img
                    src={matchedItem.targetListing.images[0]}
                    alt={matchedItem.targetListing.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[10px] text-amber-400 font-bold block truncate">
                  {matchedItem.targetListing.user.fullName}: {matchedItem.targetListing.title}
                </span>
              </div>
            </div>

            {/* Action CTA Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setMatchedItem(null);
                  navigate(`/teklif-ver?targetId=${matchedItem.targetListing.id}`);
                }}
                className="w-full py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Hemen Takas Teklifi Oluştur</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={async () => {
                  const targetUserId = matchedItem.targetListing.user.id;
                  setMatchedItem(null);
                  const conv = await messageService.getOrCreateConversationWithUser(currentUser.id, targetUserId);
                  if (conv) {
                    navigate(`/mesajlar/${conv.id}`);
                  } else {
                    showToast('Sohbet açılamadı', 'Lütfen tekrar deneyin.', 'error');
                  }
                }}
                className="w-full py-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-stone-700"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>Kullanıcıya Mesaj Gönder</span>
              </button>

              <button
                type="button"
                onClick={() => setMatchedItem(null)}
                className="text-xs text-stone-400 hover:text-white py-1 block w-full"
              >
                Kaydırmaya Devam Et
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <h3 className="text-base font-bold text-white">Eşleşme Tercihleri</h3>
              <button
                type="button"
                onClick={() => setShowFilterModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-300">Kategori</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-3 rounded-xl bg-stone-800 border border-stone-700 text-xs text-white focus:outline-hidden"
              >
                <option value="all">Tüm Kategoriler</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Distance slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-stone-300">
                <span>Maksimum Mesafe</span>
                <span className="text-emerald-400">{maxDistance} km</span>
              </div>
              <input
                type="range"
                min={2}
                max={50}
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            {/* Only verified toggle */}
            <div className="flex items-center justify-between py-2 border-t border-stone-800">
              <span className="text-xs font-bold text-stone-300">Sadece Doğrulanmış Üyeler</span>
              <input
                type="checkbox"
                checked={onlyVerified}
                onChange={(e) => setOnlyVerified(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setShowFilterModal(false);
                setCurrentIndex(0);
                showToast('Filtreler Güncellendi', undefined, 'success');
              }}
              className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
            >
              Uygula & İncele
            </button>
          </div>
        </div>
      )}

      {/* Swiped Matches Drawer Modal */}
      {showMatchesDrawer && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-md rounded-3xl p-5 space-y-4 shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Repeat className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Eşleşen İlanlar ({swipedMatches.length})</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMatchesDrawer(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {swipedMatches.length > 0 ? (
                swipedMatches.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-stone-800 rounded-2xl border border-stone-700/80 flex items-center justify-between gap-3 hover:border-emerald-500/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="w-12 h-12 rounded-xl object-cover border border-stone-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block truncate">
                          {item.title}
                        </span>
                        <span className="text-[11px] text-stone-400 block truncate">
                          {item.user.fullName} • {item.location.district}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-semibold block">
                          {item.estimatedImpact?.co2eKg || 8.2} kg CO₂e
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowMatchesDrawer(false);
                        navigate(`/teklif-ver?targetId=${item.id}`);
                      }}
                      className="px-3 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 transition-colors"
                    >
                      Teklif Ver
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-stone-400 text-xs">
                  Henüz eşleşen bir ilanınız yok. Kartları sağa kaydırarak eşleşmeler yakalayabilirsiniz.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

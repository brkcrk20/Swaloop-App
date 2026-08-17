import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SwaloopLogo } from '../common/SwaloopLogo';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  Heart,
  MapPin,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Shield,
  Smartphone,
  Globe,
  Sparkles,
} from 'lucide-react';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    currentLocation,
    setCurrentLocation,
    unreadNotificationCount,
    favoritesCount,
    deviceFrameMode,
    setDeviceFrameMode,
    t,
  } = useApp();

  const [showLocationMenu, setShowLocationMenu] = useState(false);

  const availableLocations = [
    { city: 'İstanbul', district: 'Kadıköy' },
    { city: 'İstanbul', district: 'Beşiktaş' },
    { city: 'İstanbul', district: 'Şişli' },
    { city: 'Ankara', district: 'Çankaya' },
    { city: 'İzmir', district: 'Konak' },
  ];

  const isAuthPage =
    location.pathname === '/' ||
    location.pathname.startsWith('/onboarding') ||
    location.pathname.startsWith('/kayit') ||
    location.pathname.startsWith('/dogrulama') ||
    location.pathname.startsWith('/giris') ||
    location.pathname.startsWith('/profil-olustur');

  const isAdminPage = location.pathname.startsWith('/admin');

  if (isAdminPage) return null;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800 px-3 sm:px-4 py-2 sm:py-2.5 transition-all">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: Brand Logo & Location picker */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <div onClick={() => navigate('/kesfet')} className="cursor-pointer shrink-0">
            <SwaloopLogo size="sm" />
          </div>

          {!isAuthPage && (
            <div className="relative shrink min-w-0">
              <button
                type="button"
                onClick={() => setShowLocationMenu(!showLocationMenu)}
                className="flex items-center gap-1 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:text-emerald-800 bg-stone-100/90 dark:bg-stone-800 hover:bg-stone-200/70 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-full transition-colors cursor-pointer whitespace-nowrap"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <span className="max-w-[70px] xs:max-w-[105px] sm:max-w-none truncate">
                  {currentLocation.district}, {currentLocation.city}
                </span>
                <ChevronDown className="w-3 h-3 text-stone-400 shrink-0" />
              </button>

              {showLocationMenu && (
                <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-700 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    {t('header_select_location')}
                  </div>
                  {availableLocations.map((loc) => (
                    <button
                      key={`${loc.city}-${loc.district}`}
                      type="button"
                      onClick={() => {
                        setCurrentLocation(loc);
                        setShowLocationMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-emerald-50 dark:hover:bg-stone-800 transition-colors whitespace-nowrap ${
                        currentLocation.district === loc.district
                          ? 'font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-50/60 dark:bg-stone-800/80'
                          : 'text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      <span>
                        {loc.district}, {loc.city}
                      </span>
                      {currentLocation.district === loc.district && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Quick actions (Favorites, Notifications, Public Pages, Admin switch, Device toggle) */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Quick link to web / info */}
          <button
            type="button"
            onClick={() => navigate('/hakkimizda')}
            className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors whitespace-nowrap"
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span>{t('header_what_is_swaloop')}</span>
          </button>

          {/* Favorites */}
          {!isAuthPage && (
            <button
              type="button"
              onClick={() => navigate('/favoriler')}
              className="relative p-1.5 sm:p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
              title={t('header_favorites')}
            >
              <Heart className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              {favoritesCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9.5px] font-bold flex items-center justify-center">
                  {favoritesCount}
                </span>
              )}
            </button>
          )}

          {/* Notifications */}
          {!isAuthPage && (
            <button
              type="button"
              onClick={() => navigate('/bildirimler')}
              className="relative p-1.5 sm:p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
              title={t('header_notifications')}
            >
              <Bell className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-amber-500 text-white text-[9.5px] font-bold flex items-center justify-center animate-pulse">
                  {unreadNotificationCount}
                </span>
              )}
            </button>
          )}

          {/* Admin Panel Direct Button */}
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="inline-flex items-center justify-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-stone-900 hover:bg-emerald-950 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0 whitespace-nowrap"
            title="Yönetim / Admin Paneli"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="hidden xs:inline">{t('header_admin')}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

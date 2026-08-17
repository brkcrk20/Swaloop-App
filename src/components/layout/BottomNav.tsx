import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Compass, Repeat, Plus, MessageSquare, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, t } = useApp();

  const isAuthPage =
    location.pathname === '/' ||
    location.pathname.startsWith('/onboarding') ||
    location.pathname.startsWith('/kayit') ||
    location.pathname.startsWith('/dogrulama') ||
    location.pathname.startsWith('/giris') ||
    location.pathname.startsWith('/profil-olustur');

  const isAdminPage = location.pathname.startsWith('/admin');

  if (isAuthPage || isAdminPage) return null;

  const navItems = [
    {
      id: 'kesfet',
      label: t('nav_discover'),
      icon: Compass,
      path: '/kesfet',
      activeCheck: (p: string) => p === '/kesfet' || p.startsWith('/arama') || p.startsWith('/harita'),
    },
    {
      id: 'takaslarim',
      label: t('nav_trades'),
      icon: Repeat,
      path: '/takaslarim',
      activeCheck: (p: string) =>
        p.startsWith('/takas') ||
        p.startsWith('/teklif') ||
        p.startsWith('/eslesme') ||
        p.startsWith('/kaydir') ||
        p.startsWith('/swipe') ||
        p.startsWith('/istekler'),
    },
    {
      id: 'ilan-ver',
      label: t('nav_create'),
      icon: Plus,
      path: '/ilan-ver',
      isCenterAction: true,
      activeCheck: (p: string) => p === '/ilan-ver',
    },
    {
      id: 'mesajlar',
      label: t('action_send_message') === 'Send Message' ? 'Messages' : 'Mesajlar',
      icon: MessageSquare,
      path: '/mesajlar',
      badgeCount: 1,
      activeCheck: (p: string) => p.startsWith('/mesaj'),
    },
    {
      id: 'profil',
      label: t('nav_profile'),
      icon: User,
      path: '/profil',
      activeCheck: (p: string) =>
        p === '/profil' || p.startsWith('/ayarlar') || p.startsWith('/etkim') || p.startsWith('/rozetler'),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200/90 dark:border-stone-800 py-1 px-2 shadow-lg max-w-lg mx-auto sm:rounded-t-2xl safe-area-bottom">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = item.activeCheck(location.pathname);
          const Icon = item.icon;

          if (item.isCenterAction) {
            return (
              <div key={item.id} className="relative -top-2.5">
                <button
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-800 via-emerald-700 to-teal-700 text-white flex items-center justify-center shadow-lg shadow-emerald-900/30 hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-white dark:border-stone-800"
                  title={t('nav_create')}
                >
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer relative min-w-[52px] ${
                isActive
                  ? 'text-emerald-800 dark:text-emerald-400'
                  : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
              }`}
            >
              <div className="relative">
                <Icon className={`w-4.5 h-4.5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {item.badgeCount && item.badgeCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-stone-900" />
                )}
              </div>
              <span
                className={`text-[9.5px] tracking-tight mt-0.5 whitespace-nowrap ${
                  isActive
                    ? 'font-bold text-emerald-900 dark:text-emerald-300'
                    : 'font-medium'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

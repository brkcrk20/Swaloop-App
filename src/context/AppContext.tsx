import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, NotificationItem } from '../types';
import { authService } from '../services/authService';
import { listingService } from '../services/listingService';
import { messageService } from '../services/messageService';
import { supabase } from '../lib/supabase';
import { INITIAL_NOTIFICATIONS } from '../data/mockData';
import { Language, TranslationKey, getTranslation } from '../utils/translations';

interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  description?: string;
}

interface AppContextType {
  /**
   * Giriş yapmış kullanıcı, ya da giriş yapılmadıysa `null`.
   *
   * Korumalı sayfalarda bunun yerine `useAuthUser()` kullanın: o hook
   * `<RequireAuth>` altında çalıştığı için null olmayan bir profil döndürür ve
   * her sayfada tekrar null kontrolü yazmanızı gerektirmez.
   */
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  /** Supabase oturumu ilk kez doğrulanana kadar `true`. */
  isAuthLoading: boolean;
  currentLocation: { city: string; district: string };
  setCurrentLocation: (loc: { city: string; district: string }) => void;
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => void;
  favoritesCount: number;
  unreadMessageCount: number;
  refreshUnreadMessages: () => void;
  refreshUserData: () => void;
  toasts: ToastMessage[];
  showToast: (title: string, description?: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
  deviceFrameMode: boolean;
  setDeviceFrameMode: (enabled: boolean) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  t: (key: TranslationKey) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Önbellekteki profil yalnızca ilk boyama için bir ipucu; gerçek kaynak
  // aşağıdaki useEffect içinde Supabase oturumundan doğrulanır. Önceden burada
  // oturum yoksa mock CURRENT_USER kullanılıyordu ve giriş yapmamış ziyaretçi
  // uygulamada başkası olarak oturum açmış görünüyordu.
  const [currentUser, setCurrentUserState] = useState<UserProfile | null>(() =>
    authService.getCachedUser()
  );
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [currentLocation, setCurrentLocation] = useState({ city: 'İstanbul', district: 'Kadıköy' });
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [deviceFrameMode, setDeviceFrameMode] = useState<boolean>(false);
  const [language, setLanguageState] = useState<'tr' | 'en'>(() => {
    return (localStorage.getItem('swaloop_lang') as 'tr' | 'en') || 'tr';
  });
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('swaloop_theme') as 'light' | 'dark') || 'light';
  });

  const setCurrentUser = useCallback((user: UserProfile | null) => {
    setCurrentUserState(user);
  }, []);

  const [favoritesCount, setFavoritesCount] = useState<number>(0);

  // Sayaç yenileyicilerinin currentUser'a bağımlı olmadan güncel kimliği
  // okuyabilmesi için; aksi halde her oturum değişiminde yeni callback
  // üretilip aboneliklerin yeniden kurulması gerekirdi.
  const currentUserRef = React.useRef<UserProfile | null>(currentUser);
  React.useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const refreshFavoritesCount = useCallback(() => {
    listingService.getFavorites().then((favs) => setFavoritesCount(favs.length));
  }, []);

  const [unreadMessageCount, setUnreadMessageCount] = useState<number>(0);

  const refreshUnreadMessages = useCallback(() => {
    if (!currentUserRef.current) {
      setUnreadMessageCount(0);
      return;
    }
    messageService
      .getUnreadCount(currentUserRef.current.id)
      .then(setUnreadMessageCount);
  }, []);

  // ── Oturum başlangıcı ve takibi ─────────────────────────────────────────
  // Bu blok önceden hiç yoktu: getCurrentUserFromSupabase() ve
  // onAuthStateChange() projede hiçbir yerden çağrılmıyordu, yani uygulama
  // gerçek Supabase oturumundan tamamen habersizdi.
  useEffect(() => {
    let cancelled = false;

    authService
      .getCurrentUserFromSupabase()
      .then((user) => {
        if (cancelled) return;
        setCurrentUserState(user);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Oturum doğrulanamadı:', error);
        setCurrentUserState(null);
      })
      .finally(() => {
        if (!cancelled) setIsAuthLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setCurrentUserState(null);
        setFavoritesCount(0);
        setUnreadMessageCount(0);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        authService.getCurrentUserFromSupabase().then((user) => {
          setCurrentUserState(user);
        });
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Favoriler yalnızca giriş yapılmışken okunabilir (RLS: favorites tablosu
  // satır sahibine kapalı). Oturum değiştikçe sayacı yeniliyoruz.
  useEffect(() => {
    if (!currentUser) {
      setFavoritesCount(0);
      setUnreadMessageCount(0);
      return;
    }
    refreshFavoritesCount();
    refreshUnreadMessages();
  }, [currentUser, refreshFavoritesCount, refreshUnreadMessages]);

  const setLanguage = (lang: 'tr' | 'en') => {
    setLanguageState(lang);
    localStorage.setItem('swaloop_lang', lang);
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    localStorage.setItem('swaloop_theme', newTheme);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  };

  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (title: string, description?: string, type: ToastMessage['type'] = 'success') => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      const newToast: ToastMessage = { id, title, description, type };
      setToasts((prev) => [...prev, newToast]);
      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  const refreshUserData = useCallback(() => {
    authService.getCurrentUserFromSupabase().then((user) => {
      setCurrentUserState(user);
    });
  }, []);

  const t = (key: TranslationKey): string => {
    return getTranslation(key, language);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        isAuthLoading,
        currentLocation,
        setCurrentLocation,
        notifications,
        unreadNotificationCount,
        markNotificationAsRead,
        favoritesCount,
        unreadMessageCount,
        refreshUnreadMessages,
        refreshUserData,
        toasts,
        showToast,
        removeToast,
        deviceFrameMode,
        setDeviceFrameMode,
        language,
        setLanguage,
        theme,
        setTheme,
        toggleTheme,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

/**
 * Korumalı sayfalar için: null olmayan kullanıcıyı döndürür.
 *
 * `<RequireAuth>` altında render edilen her bileşen bunu güvenle
 * kullanabilir — oturum yoksa o sayfa zaten hiç render edilmez ve kullanıcı
 * giriş ekranına yönlendirilir. Bu hook sayesinde 40'tan fazla noktada
 * `currentUser?.id` / `currentUser!` yazmak gerekmiyor.
 */
export const useAuthUser = (): UserProfile => {
  const { currentUser } = useApp();

  if (!currentUser) {
    throw new Error(
      'useAuthUser yalnızca <RequireAuth> ile korunan sayfalarda kullanılabilir.'
    );
  }

  return currentUser;
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Listing, TradeOffer, NotificationItem } from '../types';
import { authService } from '../services/authService';
import { listingService } from '../services/listingService';
import { tradeService } from '../services/tradeService';
import { INITIAL_NOTIFICATIONS } from '../data/mockData';
import { Language, TranslationKey, getTranslation } from '../utils/translations';

interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  description?: string;
}

interface AppContextType {
  currentUser: UserProfile;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  currentLocation: { city: string; district: string };
  setCurrentLocation: (loc: { city: string; district: string }) => void;
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => void;
  favoritesCount: number;
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
  const [currentUser, setCurrentUser] = useState<UserProfile>(authService.getCurrentUser());
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

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

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

  const [favoritesCount, setFavoritesCount] = useState<number>(0);

  const refreshFavoritesCount = () => {
    listingService.getFavorites().then((favs) => setFavoritesCount(favs.length));
  };

  useEffect(() => {
    refreshFavoritesCount();
  }, []);

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const showToast = (title: string, description?: string, type: ToastMessage['type'] = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastMessage = { id, title, description, type };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const refreshUserData = () => {
    setCurrentUser(authService.getCurrentUser());
  };

  const t = (key: TranslationKey): string => {
    return getTranslation(key, language);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        currentLocation,
        setCurrentLocation,
        notifications,
        unreadNotificationCount,
        markNotificationAsRead,
        favoritesCount,
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

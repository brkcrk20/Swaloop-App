import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Globe,
  Moon,
  Sun,
  Bell,
  Volume2,
  Check,
  Sparkles,
  Shield,
  Smartphone,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { language, setLanguage, theme, setTheme, showToast, t } = useApp();

  if (!isOpen) return null;

  const handleLanguageSelect = (lang: 'tr' | 'en') => {
    setLanguage(lang);
    showToast(
      lang === 'en' ? 'Language Changed' : 'Dil Değiştirildi',
      lang === 'en' ? 'App language set to English' : 'Uygulama dili Türkçe olarak güncellendi',
      'info'
    );
  };

  const handleThemeSelect = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    showToast(
      newTheme === 'dark'
        ? (language === 'en' ? 'Dark Mode Activated' : 'Karanlık Mod Açıldı')
        : (language === 'en' ? 'Light Mode Activated' : 'Aydınlık Mod Açıldı'),
      newTheme === 'dark'
        ? (language === 'en' ? 'Eye-comfort dark theme applied' : 'Gözleri yormayan gece teması uygulandı')
        : (language === 'en' ? 'Standard bright theme applied' : 'Standart aydınlık tema uygulandı'),
      'info'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white">
                {t('settings_title')}
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                {t('settings_subtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5">
          {/* Section: Appearance & Language */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              {t('settings_appearance_section')}
            </h3>

            {/* Language Switcher */}
            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-stone-900 dark:text-white">
                    {t('profile_language')}
                  </span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  {language === 'tr' ? 'Türkçe' : 'English'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleLanguageSelect('tr')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    language === 'tr'
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-white dark:bg-stone-700/70 border border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-600'
                  }`}
                >
                  <span>🇹🇷 Türkçe</span>
                  {language === 'tr' && <Check className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleLanguageSelect('en')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    language === 'en'
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-white dark:bg-stone-700/70 border border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-600'
                  }`}
                >
                  <span>🇬🇧 English</span>
                  {language === 'en' && <Check className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Theme Switcher */}
            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {theme === 'dark' ? (
                    <Moon className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <span className="text-xs font-bold text-stone-900 dark:text-white">
                    {t('profile_theme')}
                  </span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200">
                  {theme === 'dark' ? t('profile_dark') : t('profile_light')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleThemeSelect('light')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    theme === 'light'
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-white dark:bg-stone-700/70 border border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-600'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t('profile_light')}</span>
                  {theme === 'light' && <Check className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeSelect('dark')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-white dark:bg-stone-700/70 border border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-600'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t('profile_dark')}</span>
                  {theme === 'dark' && <Check className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Section: Preferences & Toggles */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              {t('settings_notifications_section')}
            </h3>

            <div className="space-y-2">
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5 pr-2">
                  <Bell className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-stone-900 dark:text-white block">
                      {t('settings_trade_notifications')}
                    </span>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400 block">
                      {t('settings_trade_notifications_sub')}
                    </span>
                  </div>
                </div>
                <div className="w-9 h-5 rounded-full bg-emerald-700 flex items-center justify-end px-0.5 cursor-pointer">
                  <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5 pr-2">
                  <Volume2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-stone-900 dark:text-white block">
                      {t('settings_sound_haptics')}
                    </span>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400 block">
                      {t('settings_sound_haptics_sub')}
                    </span>
                  </div>
                </div>
                <div className="w-9 h-5 rounded-full bg-emerald-700 flex items-center justify-end px-0.5 cursor-pointer">
                  <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </div>
              </div>
            </div>
          </div>

          {/* App Info Footer in modal */}
          <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              Swaloop v1.2.0 • Güvenli Takas
            </span>
            <span className="font-mono">Build 2026</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            {t('settings_done')}
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';

/**
 * Oturum doğrulanırken gösterilen ara ekran. Önbellekten gelen profil ile
 * gerçek Supabase oturumu arasındaki farkı kapatana kadar (genelde birkaç yüz
 * ms) sayfayı render etmiyoruz — aksi halde giriş yapmış bir kullanıcı bir an
 * için giriş ekranına atılırdı.
 */
const AuthLoading: React.FC = () => (
  <div
    className="flex flex-col items-center justify-center py-24 gap-3 text-stone-500 dark:text-stone-400"
    role="status"
    aria-live="polite"
  >
    <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
    <span className="text-sm">Oturum kontrol ediliyor…</span>
  </div>
);

/**
 * Giriş yapılmamışsa /giris sayfasına yönlendirir.
 *
 * Kullanıcının gitmek istediği adres `state.from` içinde taşınır, böylece
 * giriş sonrası kaldığı yere dönebilir.
 */
export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthLoading } = useApp();
  const location = useLocation();

  if (isAuthLoading) {
    return <AuthLoading />;
  }

  if (!currentUser) {
    return <Navigate to="/giris" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};

/**
 * Yalnızca profiles.role = 'admin' | 'moderator' olan kullanıcılara açık.
 *
 * ÖNEMLİ: Bu yalnızca arayüz seviyesinde bir kolaylıktır. Asıl koruma
 * veritabanındaki RLS politikalarındadır (bkz.
 * 20260821090000_enable_rls_all_tables.sql, public.is_admin()) — istemci
 * tarafı kontrolü atlatılabilir, RLS atlatılamaz.
 */
export const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthLoading } = useApp();
  const location = useLocation();

  if (isAuthLoading) {
    return <AuthLoading />;
  }

  if (!currentUser) {
    return <Navigate to="/giris" replace state={{ from: location.pathname }} />;
  }

  if (currentUser.role !== 'admin' && currentUser.role !== 'moderator') {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 gap-3 text-center">
        <ShieldAlert className="w-10 h-10 text-amber-600" aria-hidden="true" />
        <h1 className="text-lg font-bold text-stone-900 dark:text-stone-100">
          Bu sayfaya erişiminiz yok
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 max-w-sm">
          Yönetim paneli yalnızca Swaloop moderatörlerine açıktır.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

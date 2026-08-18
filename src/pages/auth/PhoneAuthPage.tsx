import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { SwaloopLogo } from '../../components/common/SwaloopLogo';
import { ArrowLeft, Smartphone, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface PhoneAuthPageProps {
  isRegister: boolean;
}

export const PhoneAuthPage: React.FC<PhoneAuthPageProps> = ({ isRegister }) => {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingUserModal, setExistingUserModal] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = authService.formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authService.isValidPhone(phone)) {
      showToast('Geçersiz Numara', 'Lütfen 10 haneli geçerli bir telefon numarası giriniz (5XX...).', 'error');
      return;
    }

    setIsSubmitting(true);
    const check = await authService.checkPhoneRegistered(phone);

    // If existing, we can let user proceed to login OTP or show existing account notice
    await authService.sendOtp(phone);
    setIsSubmitting(false);

    // Navigate to OTP verification passing phone & state
    navigate('/dogrulama', {
      state: {
        phone,
        isExisting: check.exists,
      },
    });
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col justify-between p-6 max-w-md mx-auto">
      {/* Top Bar */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl bg-white border border-stone-200 text-stone-700 flex items-center justify-center hover:bg-stone-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <SwaloopLogo size="sm" />
          <div className="w-10" />
        </div>

        <div className="space-y-2 mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-display tracking-tight">
            Telefon ile Kayıt / Giriş
          </h1>
          <p className="text-sm text-stone-500">
            Swaloop topluluğuna katılmak için telefon numaranı gir. Güvenlik için SMS kodu göndereceğiz.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Telefon Numarası
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 flex items-center gap-1.5 text-stone-500 font-medium text-sm border-r border-stone-200 pr-2.5">
                <span className="text-base">🇹🇷</span>
                <span className="font-semibold text-stone-800">TR +90</span>
              </div>
              <input
                type="tel"
                value={phone.replace('+90 ', '')}
                onChange={handlePhoneChange}
                placeholder="5XX XXX XX XX"
                maxLength={13}
                autoFocus
                className="w-full pl-28 pr-4 py-4 rounded-2xl bg-white border-2 border-stone-200 focus:border-emerald-600 focus:outline-hidden text-base font-semibold text-stone-900 tracking-wide transition-all shadow-xs"
              />
            </div>
            <span className="text-[11px] text-stone-400 mt-1.5 block">
              Örnek: 532 123 45 67 (Şifre gerektirmez, OTP ile anında doğrulama)
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 leading-relaxed">
              <strong className="block font-bold">1 Telefon = 1 Hesap Kuralı</strong>
              Her telefon numarasıyla yalnızca tek bir Swaloop hesabı açılabilir. Güvenli takas
              ağımız doğrulanmış gerçek profillerle korunur.
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || phone.length < 5}
            className="w-full py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-base shadow-md shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {isSubmitting ? 'Kod Gönderiliyor...' : 'Devam Et'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Footer info */}
      <div className="pt-6 text-center text-xs text-stone-400">
        Devam ederek Swaloop <span className="underline text-stone-600">Kullanım Koşulları</span> ve{' '}
        <span className="underline text-stone-600">Gizlilik Politikası</span>'nı kabul etmiş olursun.
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { ArrowLeft, CheckCircle2, Delete, RefreshCw, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const OtpVerificationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setCurrentUser, showToast } = useApp();

  const state = (location.state as { phone?: string; isExisting?: boolean }) || {};
  const phone = state.phone || '+90 532 890 12 34';
  const isExisting = state.isExisting || false;

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [timer, setTimer] = useState<number>(56);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleKeypadPress = (val: string) => {
    if (val === 'backspace') {
      const lastFilledIndex = [...otp].reverse().findIndex((c) => c !== '');
      if (lastFilledIndex !== -1) {
        const actualIndex = 5 - lastFilledIndex;
        const next = [...otp];
        next[actualIndex] = '';
        setOtp(next);
      }
      return;
    }

    const firstEmptyIndex = otp.findIndex((c) => c === '');
    if (firstEmptyIndex !== -1) {
      const next = [...otp];
      next[firstEmptyIndex] = val;
      setOtp(next);

      // If finished 6 digits, auto trigger verification
      if (firstEmptyIndex === 5) {
        verifyCode(next.join(''));
      }
    }
  };

  const handleAutoFillDemo = () => {
    const demoCode = '246810';
    setOtp(demoCode.split(''));
    verifyCode(demoCode);
  };

  const verifyCode = async (code: string) => {
    setIsVerifying(true);
    const res = await authService.verifyOtp(phone, code);
    setIsVerifying(false);

    if (res.success) {
      showToast('Doğrulama Başarılı!', 'Hoş geldiniz.', 'success');
      if (res.isNewUser) {
        navigate('/profil-olustur', { state: { phone } });
      } else {
        if (res.user) setCurrentUser(res.user);
        navigate('/kesfet');
      }
    } else {
      showToast('Hatalı Kod', 'Lütfen SMS ile gelen 6 haneli kodu kontrol ediniz (Demo: 246810).', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col justify-between p-6 max-w-md mx-auto">
      {/* Top Bar */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl bg-white border border-stone-200 text-stone-700 flex items-center justify-center hover:bg-stone-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Adım 2 / 3
          </span>
        </div>

        <div className="space-y-2 mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-display tracking-tight">
            Doğrulama Kodu
          </h1>
          <p className="text-sm text-stone-500">
            <span className="font-semibold text-stone-800">{phone}</span> numarasına gönderilen 6 haneli SMS kodunu gir.
          </p>
        </div>

        {/* 6 Digit Pin Boxes */}
        <div className="flex justify-between gap-2 sm:gap-2.5 my-6">
          {otp.map((digit, idx) => (
            <div
              key={idx}
              className={`w-12 h-14 sm:w-14 sm:h-16 rounded-2xl flex items-center justify-center text-xl font-extrabold font-display border-2 transition-all shadow-xs ${
                digit
                  ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 scale-105'
                  : 'border-stone-200 bg-white text-stone-400'
              }`}
            >
              {digit || '•'}
            </div>
          ))}
        </div>

        {/* Demo Fast Fill Button & Resend Timer */}
        <div className="flex items-center justify-between text-xs text-stone-500 mb-6">
          <button
            type="button"
            onClick={handleAutoFillDemo}
            className="inline-flex items-center gap-1 text-emerald-700 font-bold hover:underline cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Demo Kodu Doldur (246810)</span>
          </button>

          <span>
            {timer > 0 ? (
              `Kodu yeniden gönder (${timer}sn)`
            ) : (
              <button
                type="button"
                onClick={() => setTimer(60)}
                className="text-emerald-700 font-bold hover:underline"
              >
                Yeniden Gönder
              </button>
            )}
          </span>
        </div>
      </div>

      {/* Custom Keypad for Mobile-Native Feel */}
      <div className="pt-2">
        <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-xs mx-auto mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'backspace'].map((key, i) => {
            if (key === '') return <div key={i} />;
            if (key === 'backspace') {
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleKeypadPress('backspace')}
                  className="h-14 rounded-2xl bg-stone-100 hover:bg-stone-200 active:bg-stone-300 flex items-center justify-center text-stone-700 transition-colors cursor-pointer"
                >
                  <Delete className="w-6 h-6" />
                </button>
              );
            }
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleKeypadPress(key)}
                className="h-14 rounded-2xl bg-white hover:bg-stone-100 active:bg-emerald-50 border border-stone-200 shadow-xs flex items-center justify-center text-xl font-bold text-stone-800 transition-all active:scale-95 cursor-pointer font-display"
              >
                {key}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => verifyCode(otp.join(''))}
          disabled={otp.join('').length < 6 || isVerifying}
          className="w-full py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-base shadow-md shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          {isVerifying ? 'Doğrulanıyor...' : 'Doğrula ve Devam Et'}
        </button>
      </div>
    </div>
  );
};

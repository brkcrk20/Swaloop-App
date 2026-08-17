import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SwaloopLogo, CircularExchangeIcon } from '../../components/common/SwaloopLogo';
import {
  ArrowRight,
  ArrowLeft,
  Leaf,
  ShieldCheck,
  Repeat,
  Sparkles,
  MapPin,
  PlusCircle,
  CheckCircle2,
} from 'lucide-react';
import { authService } from '../../services/authService';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Swaloop Nedir?',
      subtitle: 'Satma. Takas et. Yeniden kullan.',
      description:
        'Swaloop klasik bir ikinci el satış uygulaması değildir. Kullanıcıların nakit para ödemeden ürünlerini karşılıklı takas ettikleri sürdürülebilir bir sosyal takas platformudur.',
      icon: CircularExchangeIcon,
      accentColor: 'from-emerald-800 to-teal-900',
    },
    {
      title: 'Nasıl Çalışır?',
      subtitle: '3 Adımda Kolay Takas',
      description:
        '1. Kullanmadığın ürünün ilanını oluştur.\n2. Sana uygun ürünleri keşfet ve takas teklifi gönder.\n3. Güvenli buluşma noktasında veya kargo ile takasını tamamla.',
      icon: Repeat,
      accentColor: 'from-amber-700 to-orange-800',
    },
    {
      title: 'Çevresel Etki (SVS) Nedir?',
      subtitle: 'SVS Kesinlikle Para veya Fiyat Değildir!',
      description:
        'Her takas sıfırdan üretim yerine mevcut bir eşyayı dolaşıma sokar. Swaloop; önlenen CO₂e salımını, tasarruf edilen suyu ve korunan hammaddeyi hesaplayarak doğaya kazandırdığın faydayı gösterir.',
      icon: Leaf,
      accentColor: 'from-emerald-900 to-emerald-700',
    },
    {
      title: 'Döngüsel Ekonomi & Loop',
      subtitle: '3 veya daha fazla kişiyle çoklu takaslar!',
      description:
        'Sen Kullanıcı A’ya, Kullanıcı A Kullanıcı B’ye, Kullanıcı B de sana vererek döngüsel çoklu takaslar (Loop) yapabilirsin. Herkes istediğini kazanır!',
      icon: Sparkles,
      accentColor: 'from-teal-800 to-emerald-900',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      authService.setOnboardingDone(true);
      navigate('/kayit');
    }
  };

  const current = steps[currentStep];
  const StepIcon = current.icon;

  return (
    <div className="min-h-screen bg-stone-950 text-white flex flex-col justify-between p-6 max-w-md mx-auto relative overflow-hidden">
      {/* Top Header & Skip */}
      <div className="flex items-center justify-between z-10">
        <SwaloopLogo size="sm" variant="white" />
        <button
          type="button"
          onClick={() => {
            authService.setOnboardingDone(true);
            navigate('/kesfet');
          }}
          className="text-xs text-stone-400 hover:text-white transition-colors cursor-pointer"
        >
          Atla
        </button>
      </div>

      {/* Main card */}
      <div className="my-auto py-8 z-10 flex flex-col items-center text-center">
        {/* Animated illustration container */}
        <div className="w-28 h-28 rounded-3xl bg-stone-900/80 border border-stone-800 flex items-center justify-center mb-8 shadow-2xl relative">
          <div className="absolute inset-0 rounded-3xl bg-emerald-600/10 blur-xl pointer-events-none" />
          {typeof StepIcon === 'function' ? (
            currentStep === 0 ? (
              <CircularExchangeIcon size={52} animate />
            ) : (
              // @ts-ignore
              <StepIcon className="w-12 h-12 text-emerald-400" />
            )
          ) : null}
        </div>

        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2">
          {current.subtitle}
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight mb-4">
          {current.title}
        </h2>
        <p className="text-sm text-stone-300 leading-relaxed max-w-xs whitespace-pre-line">
          {current.description}
        </p>

        {/* Step indicator dots */}
        <div className="flex items-center gap-2 mt-8">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentStep ? 'w-8 bg-emerald-500' : 'w-2 bg-stone-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="z-10 space-y-3">
        <button
          type="button"
          onClick={handleNext}
          className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <span>{currentStep === steps.length - 1 ? 'Hemen Başla' : 'İlerle'}</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        {currentStep > 0 && (
          <button
            type="button"
            onClick={() => setCurrentStep((prev) => prev - 1)}
            className="w-full py-2.5 text-xs text-stone-400 hover:text-stone-200 transition-colors"
          >
            Geri
          </button>
        )}
      </div>
    </div>
  );
};

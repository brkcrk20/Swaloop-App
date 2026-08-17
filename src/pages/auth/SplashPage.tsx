import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SwaloopLogo, CircularExchangeIcon } from '../../components/common/SwaloopLogo';
import { Sparkles, ShieldCheck, Leaf, ArrowRight, RefreshCw, Zap } from 'lucide-react';

export const SplashPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Sparkles,
      title: 'Akıllı Eşleşme',
      desc: 'İhtiyacın olanla seni en uygun takaslarla buluşturur.',
      color: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    },
    {
      icon: ShieldCheck,
      title: 'Güvenli Topluluk',
      desc: 'Doğrulanmış üyelerle güvenli takas ortamı sağlar.',
      color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    },
    {
      icon: Leaf,
      title: 'Çevresel Etki (SVS)',
      desc: 'Her takasın doğaya kazandırdığı su, enerji ve CO₂e katkısını hesaplar.',
      color: 'text-teal-400 bg-teal-400/10 border-teal-400/20',
    },
    {
      icon: RefreshCw,
      title: 'Kolay ve Keyifli',
      desc: 'Modern arayüzü ile takas yapmak hem sıfır maliyetli hem eğlenceli.',
      color: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    },
  ];

  return (
    <div className="min-h-screen bg-stone-950 text-white flex flex-col justify-between p-6 sm:p-8 max-w-md mx-auto relative overflow-hidden">
      {/* Subtle organic background ambient glow */}
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-emerald-700/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-amber-600/15 blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 pt-4 text-center flex flex-col items-center">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-stone-900/80 border border-stone-800 shadow-xl mb-4">
          <CircularExchangeIcon size={44} animate />
        </div>
        <SwaloopLogo size="lg" variant="white" showSlogan />
      </div>

      {/* Features list */}
      <div className="relative z-10 my-8 space-y-3">
        {features.map((f, idx) => {
          const Icon = f.icon;
          return (
            <div
              key={idx}
              className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-stone-900/60 border border-stone-800/80 backdrop-blur-md"
            >
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${f.color}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-stone-100">{f.title}</h4>
                <p className="text-xs text-stone-400 leading-snug mt-0.5">{f.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA buttons */}
      <div className="relative z-10 space-y-3 pt-2">
        <button
          type="button"
          onClick={() => navigate('/kayit')}
          className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 transition-all hover:gap-3 cursor-pointer"
        >
          <span>Telefonla Başla</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-between text-xs text-stone-400 px-2 pt-1">
          <button
            type="button"
            onClick={() => navigate('/onboarding')}
            className="hover:text-emerald-400 transition-colors"
          >
            Nasıl Çalışır?
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => navigate('/kesfet')}
            className="text-amber-400 font-semibold hover:text-amber-300 transition-colors"
          >
            Uygulamayı Keşfet →
          </button>
        </div>
      </div>
    </div>
  );
};

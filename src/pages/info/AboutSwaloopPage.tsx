import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Leaf, ShieldCheck, Repeat, HeartHandshake, CheckCircle2, ArrowRight } from 'lucide-react';
import { SwaloopLogo } from '../../components/common/SwaloopLogo';

export const AboutSwaloopPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-stone-50 pb-28 text-stone-900">
      <div className="max-w-md md:max-w-2xl mx-auto px-4 pt-4 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <SwaloopLogo size="sm" />
        </div>

        {/* Hero Concept */}
        <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-950 text-white rounded-3xl p-6 shadow-md space-y-3">
          <span className="text-[11px] font-bold text-emerald-200 tracking-wider uppercase">
            Satma. Takas Et. Yeniden Kullan.
          </span>
          <h1 className="text-xl font-black text-white leading-tight">
            Paranın Geçmediği, Doğanın Kazandığı Sosyal Takas Ekosistemi
          </h1>
          <p className="text-xs text-emerald-100/90 leading-relaxed">
            Swaloop, tüketim çılgınlığını durdurmak ve evlerimizde atıl bekleyen kaliteli eşyaları doğrudan ihtiyacı olanlarla buluşturmak için tasarlandı.
          </p>
        </div>

        {/* 4 Pillars of Swaloop */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Temel İlkelerimiz</h2>

          <div className="p-4 rounded-2xl bg-white border border-stone-200/90 space-y-1.5 shadow-xs">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-emerald-800" />
              <h3 className="text-sm font-bold text-stone-900">1. Kesinlikle Para Yok</h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Platformda hiçbir para transferi veya gizli ücret yoktur. Eşyalar birbirlerinin değerini karşılar; böylece enflasyon veya fiyat spekülasyonu olmadan adil takas gerçekleşir.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-stone-200/90 space-y-1.5 shadow-xs">
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-teal-800" />
              <h3 className="text-sm font-bold text-stone-900">2. SVS (Sürdürülebilirlik Değer Sistemi)</h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Her takas, sıfırdan ürün üretilmesini engelleyerek CO₂e, sanal su ve enerji tasarrufu sağlar. Bu etki doğrulanmış LCA modelleriyle profilinize rozet ve puan olarak yansır.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-stone-200/90 space-y-1.5 shadow-xs">
            <div className="flex items-center gap-2">
              <Repeat className="w-5 h-5 text-emerald-700" />
              <h3 className="text-sm font-bold text-stone-900">3. Çoklu Döngü Takasları</h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              İki kişinin ürünleri doğrudan uyuşmasa bile, yapay zeka destekli döngü algoritması 3 veya daha fazla kullanıcıyı dairesel olarak (A→B→C→A) eşleştirir.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-stone-200/90 space-y-1.5 shadow-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-stone-900" />
              <h3 className="text-sm font-bold text-stone-900">4. Güvenli Takas & Buluşma Noktaları</h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              6 adımlı kilit sistemiyle ürünler güvenceye alınır. Metro çıkışları, AVM'ler ve kamuya açık güvenli noktalarda teslimat önerilir.
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <button
          type="button"
          onClick={() => navigate('/kesfet')}
          className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Hemen Takasa Başla</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

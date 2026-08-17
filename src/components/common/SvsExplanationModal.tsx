import React from 'react';
import { X, Leaf, AlertCircle, ShieldCheck, RefreshCw, BarChart2 } from 'lucide-react';
import { CircularExchangeIcon } from './SwaloopLogo';

interface SvsExplanationModalProps {
  onClose: () => void;
}

export const SvsExplanationModal: React.FC<SvsExplanationModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-100 bg-emerald-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900 font-display">
                SVS Nedir? (Çevresel Etki)
              </h3>
              <p className="text-xs text-emerald-800 font-medium">
                Sürdürülebilir Varlık Skoru Metodolojisi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-stone-100 text-stone-600 flex items-center justify-center transition-colors shadow-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-stone-700">
          {/* Critical Notice */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <strong className="block text-amber-950 font-bold mb-0.5">
                Kritik Kural: SVS Kesinlikle Para veya Fiyat Değildir!
              </strong>
              SVS ürünlerin parasal değeri, fiyatı veya takas puanı değildir. Swaloop’ta takaslar
              nakit para olmadan, iki tarafın karşılıklı memnuniyetiyle gerçekleşir.
            </div>
          </div>

          <div>
            <h4 className="font-bold text-stone-900 mb-2 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-600" />
              SVS Neyi Gösterir?
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed mb-3">
              Bir ürün satın almak yerine takas edilip tekrar kullanıldığında, yeni bir ürünün
              üretilmesi için gereken doğal kaynakların harcanması önlenir.
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="font-bold text-emerald-900 block">CO₂e Emisyonu</span>
                <span className="text-stone-500 text-[11px]">Fabrika üretimi ve lojistikte salınmayan sera gazı</span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="font-bold text-emerald-900 block">Su Tüketimi (L)</span>
                <span className="text-stone-500 text-[11px]">Tekstil, metal ve plastik üretiminde tasarruf edilen su</span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="font-bold text-emerald-900 block">Enerji (kWh)</span>
                <span className="text-stone-500 text-[11px]">Madencilik ve montajda tüketilmeyen enerji</span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="font-bold text-emerald-900 block">Hammadde (kg)</span>
                <span className="text-stone-500 text-[11px]">Doğadan çıkarılmayan primer maden ve plastik</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-900 text-white flex items-center gap-4">
            <CircularExchangeIcon size={34} className="shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-amber-300 block mb-0.5">Döngüsel Ekonomi</span>
              <p className="text-emerald-100 leading-relaxed">
                Her takas, bir eşyanın çöp sahasına gitmesini geciktirir ve gezegenimizin geleceğine
                somut katkı sağlar.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-100 bg-stone-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm transition-colors cursor-pointer"
          >
            Anladım
          </button>
        </div>
      </div>
    </div>
  );
};

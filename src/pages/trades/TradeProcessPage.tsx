import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp, useAuthUser } from '../../context/AppContext';
import { tradeService } from '../../services/tradeService';
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  Truck,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  PackageCheck,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';

export const TradeProcessPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useApp();
  const currentUser = useAuthUser();

  const [currentStep, setCurrentStep] = useState<number>(3); // Step 3: Takas Kilitlendi in mockup
  const [deliveryType, setDeliveryType] = useState('Elden teslim - Kadıköy');
  const [deliveryDate, setDeliveryDate] = useState('18 Mayıs 2024, Cumartesi 16:00');
  const [safeMeetingPoint, setSafeMeetingPoint] = useState('Kadıköy Boğa Heykeli & Güvenli Takas Noktası');

  const steps = [
    { num: 1, title: 'Teklif', desc: 'Teklif iletildi' },
    { num: 2, title: 'Kabul', desc: 'Teklif onaylandı' },
    { num: 3, title: 'Kilitlendi', desc: 'Ürünler rezerve edildi' },
    { num: 4, title: 'Teslimat', desc: 'Fiziki buluşma / Kargo' },
    { num: 5, title: 'Onay', desc: 'Ürün kontrolü ve doğrulama' },
    { num: 6, title: 'Tamamlandı', desc: 'SVS etkisi işlendi' },
  ];

  const handleNextStep = () => {
    if (currentStep === 3) {
      setCurrentStep(4);
      showToast('Teslimat Planlandı', 'Karşı tarafa buluşma detayları bildirildi.', 'success');
    } else if (currentStep === 4) {
      setCurrentStep(5);
      showToast('Teslimat Gerçekleşti', 'Ürün teslim alındı, lütfen onaylayınız.', 'info');
    } else if (currentStep === 5) {
      setCurrentStep(6);
      navigate(`/takas-tamamlandi/${id || 'trade-1'}`);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24 text-stone-900">
      <div className="max-w-md md:max-w-xl mx-auto px-4 pt-4 space-y-6">
        {/* Top Header Matching Screen 11 */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl bg-white border border-stone-200 text-stone-700 flex items-center justify-center hover:bg-stone-100 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-extrabold text-stone-900 font-display">Takas Süreci</h1>
          <div className="w-10" />
        </div>

        {/* 6-Step Horizontal Timeline Matching Screen 11 */}
        <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-stone-200/90 shadow-xs overflow-x-auto no-scrollbar">
          <div className="flex items-center justify-between relative min-w-[320px] px-1">
            {/* Connecting background line */}
            <div className="absolute left-4 right-4 top-3.5 h-0.5 bg-stone-200 -z-0" />

            {steps.map((step) => {
              const isPassed = step.num < currentStep;
              const isCurrent = step.num === currentStep;

              return (
                <div key={step.num} className="flex flex-col items-center relative z-10">
                  <div
                    onClick={() => setCurrentStep(step.num)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-emerald-900 text-white ring-3 ring-emerald-100 scale-105'
                        : isPassed
                        ? 'bg-emerald-700 text-white'
                        : 'bg-stone-200 text-stone-500'
                    }`}
                  >
                    {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.num}
                  </div>
                  <span
                    className={`text-[9px] sm:text-[10px] mt-1 font-semibold whitespace-nowrap ${
                      isCurrent
                        ? 'text-emerald-900 font-bold'
                        : isPassed
                        ? 'text-emerald-700'
                        : 'text-stone-400'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Step Content Box Matching Screen 11 */}
        <div className="text-center py-5 px-4 bg-white rounded-3xl border border-stone-200/90 shadow-xs space-y-1.5">
          <span className="text-[11px] font-extrabold text-emerald-800 tracking-wider uppercase block">
            {currentStep}. ADIM
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 font-display">
            {currentStep === 1 && 'Takas Teklifi İletildi'}
            {currentStep === 2 && 'Teklif Kabul Edildi'}
            {currentStep === 3 && 'Takas Kilitlendi'}
            {currentStep === 4 && 'Teslimat Süreci'}
            {currentStep === 5 && 'Fiziki Onay & Kontrol'}
            {currentStep === 6 && 'Takas Tamamlandı'}
          </h2>
          <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
            {currentStep === 3
              ? 'Ürünler takas için hazır. Lütfen teslimat planını oluşturun.'
              : currentStep === 4
              ? 'Belirlenen randevu saatinde güvenli buluşma noktasında takası gerçekleştirin.'
              : currentStep === 5
              ? 'Ürünü fiziki olarak inceleyin ve durumunu onaylayın.'
              : 'Takas süreciniz başarıyla ilerliyor.'}
          </p>
        </div>

        {/* Teslimat Bilgileri Card Matching Screen 11 */}
        <div className="bg-white rounded-3xl border border-stone-200/90 p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <span className="text-xs font-bold text-stone-800">Teslimat Bilgileri</span>
            <ChevronDown className="w-4 h-4 text-stone-400" />
          </div>

          <div className="space-y-2.5 text-xs text-stone-700">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <span className="font-bold text-stone-900 block">{deliveryType}</span>
                <span className="text-[11px] text-stone-400">{safeMeetingPoint}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <span className="font-bold text-stone-900 block">{deliveryDate}</span>
                <span className="text-[11px] text-stone-400">Karşılıklı onaylanmış randevu</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Lock Guarantee */}
        <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-900 leading-relaxed">
            <strong className="block font-bold">Kilitli Ürün Güvencesi</strong>
            Takas kilitlendiğinde eşyalar diğer kullanıcılara teklife kapatılır. Teslimat tamamlanana kadar haklarınız korunur.
          </div>
        </div>

        {/* Bottom Action Button Matching Screen 11 */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleNextStep}
            className="w-full py-4 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-base shadow-md shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>
              {currentStep === 3 && 'Teslimatı Planla'}
              {currentStep === 4 && 'Teslim Edildi Olarak İşaretle'}
              {currentStep === 5 && 'Ürünü Onayla & Tamamla'}
              {currentStep >= 6 && 'Tamamlandı'}
            </span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

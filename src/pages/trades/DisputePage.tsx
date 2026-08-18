import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { tradeService } from '../../services/tradeService';
import { TradeOffer } from '../../types';
import { ArrowLeft, AlertTriangle, ShieldAlert, Camera, UploadCloud, CheckCircle2 } from 'lucide-react';

export const DisputePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tradeId = searchParams.get('tradeId');
  const { showToast } = useApp();

  const [trade, setTrade] = useState<TradeOffer | undefined>(undefined);

  useEffect(() => {
    if (!tradeId) return;
    tradeService.getTradeById(tradeId).then(setTrade);
  }, [tradeId]);

  const [reason, setReason] = useState('broken_item');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80',
  ]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      showToast('Lütfen karşılaştığınız sorunu açıklayınız.', undefined, 'error');
      return;
    }

    setIsSubmitted(true);
    showToast('Sorun Bildirimi Alındı', 'Admin ekibimiz inceleyip 24 saat içinde dönüş yapacaktır.', 'info');
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24 text-stone-900">
      <div className="max-w-md md:max-w-xl mx-auto px-4 pt-3 space-y-4">
        {/* Top Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-stone-900">Sorun Bildir & İnceleme Talebi</h1>
            <p className="text-xs text-stone-500">Güvenli takas hakem heyeti desteği</p>
          </div>
        </div>

        {isSubmitted ? (
          <div className="bg-white rounded-3xl border border-stone-200 p-6 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-base font-bold text-stone-900">Talebiniz Alındı</h2>
            <p className="text-xs text-stone-600 leading-relaxed">
              Takas süreciniz incelemeye alınmıştır. Her iki tarafın beyanları ve fotoğraflar incelenerek admin heyeti tarafından karar verilecektir.
            </p>
            <button
              type="button"
              onClick={() => navigate('/takaslarim')}
              className="w-full py-3 bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-900 transition-colors"
            >
              Takaslarıma Dön
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Info notice */}
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold block mb-0.5">Güvenli Takas Koruma Protokolü</span>
                <span>
                  Ürün tarif edildiği gibi değilse, eksik parça varsa veya teslimat gerçekleşmediyse bu formu doldurabilirsiniz.
                </span>
              </div>
            </div>

            {/* Form inputs */}
            <div className="bg-white rounded-2xl border border-stone-200/90 p-4 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1">Sorun Kategorisi</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-hidden focus:border-emerald-700"
                >
                  <option value="broken_item">Ürün Hasarlı veya Kusurlu Geldi</option>
                  <option value="not_as_described">Ürün Açıklamaya Uygun Değil / Yanlış Ürün</option>
                  <option value="missing_parts">Eksik Aksesuar / Parça</option>
                  <option value="no_delivery">Karşı Taraf Teslimata Gelmedi / Kargolamadı</option>
                  <option value="other">Diğer Güvenlik Sorunu</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1">Detaylı Açıklama</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Yaşadığınız durumu, eksikleri veya hasarları detaylıca anlatınız..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-hidden focus:border-emerald-700 resize-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1">Kanıt Fotoğrafları</label>
                <div className="flex items-center gap-2">
                  {photos.map((url, idx) => (
                    <div key={idx} className="w-16 h-16 rounded-xl overflow-hidden border border-stone-200 relative">
                      <img src={url} alt="Kanıt" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setPhotos([
                        ...photos,
                        'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80',
                      ])
                    }
                    className="w-16 h-16 rounded-xl border-2 border-dashed border-stone-300 hover:border-emerald-700 flex flex-col items-center justify-center text-stone-400 hover:text-emerald-800 transition-colors"
                  >
                    <Camera className="w-5 h-5" />
                    <span className="text-[9px] font-bold mt-1">Ekle</span>
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              İnceleme Talebini Gönder
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

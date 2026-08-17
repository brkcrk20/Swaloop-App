import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  ArrowLeft,
  CheckCircle2,
  Star,
  Leaf,
  Share2,
  Sparkles,
  Award,
  ThumbsUp,
  Heart,
} from 'lucide-react';

export const TradeSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useApp();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('Harika bir takastı, ürün tam açıklandığı gibiydi.');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isReviewed, setIsReviewed] = useState(false);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    setIsReviewed(true);
    setShowReviewModal(false);
    showToast('Değerlendirme Kaydedildi! ⭐', 'Güven puanına katkı sağladınız.', 'success');
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24 text-stone-900 flex flex-col justify-between">
      <div className="max-w-md md:max-w-xl mx-auto px-4 pt-4 w-full space-y-6">
        {/* Top Header Matching Screen 12 */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/takaslarim')}
            className="w-10 h-10 rounded-2xl bg-white border border-stone-200 text-stone-700 flex items-center justify-center hover:bg-stone-100 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-extrabold text-stone-900 font-display">Takas Tamamlandı</h1>
          <div className="w-10" />
        </div>

        {/* Big Green Check Circle with Sparkles Matching Screen 12 */}
        <div className="flex flex-col items-center justify-center pt-8 pb-4 text-center">
          <div className="relative mb-6">
            <div className="w-28 h-28 rounded-full bg-emerald-800 text-white flex items-center justify-center shadow-xl shadow-emerald-900/20 ring-8 ring-emerald-100 animate-in zoom-in-90 duration-300">
              <CheckCircle2 className="w-16 h-16 stroke-[2.5]" />
            </div>
            <Sparkles className="w-6 h-6 text-amber-400 absolute -top-1 -right-2 animate-bounce" />
            <Sparkles className="w-5 h-5 text-emerald-500 absolute -bottom-1 -left-2" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 font-display tracking-tight">
            Takas başarıyla tamamlandı!
          </h2>
          <p className="text-sm text-stone-500 mt-1 max-w-xs">
            Swaloop'a katkın için teşekkürler.
          </p>
        </div>

        {/* Environmental Impact Card Matching Screen 12 */}
        <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-3xl p-5 text-center space-y-1 shadow-xs">
          <span className="text-xs font-bold text-emerald-900 block">
            Bu takasın çevresel etkisi
          </span>
          <div className="text-3xl font-black text-emerald-950 font-display">
            8.6 kg CO₂e
          </div>
          <span className="text-xs font-medium text-emerald-800/80 block">
            önlenmesine katkı sağladın.
          </span>
        </div>

        {/* Additional Badge Unlocked Notification */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center text-xl">
            🏅
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-stone-900 block">Yeni Rozet Kazanıldı!</span>
            <span className="text-[11px] text-stone-500">"İlk Takasım" rozeti profilinize eklendi.</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/rozetlerim')}
            className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer"
          >
            Gör →
          </button>
        </div>
      </div>

      {/* Bottom Action Button Matching Screen 12 */}
      <div className="max-w-md md:max-w-xl mx-auto px-4 w-full pt-4 space-y-2.5">
        <button
          type="button"
          onClick={() => setShowReviewModal(true)}
          className="w-full py-4 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-base shadow-md shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Star className="w-5 h-5 fill-amber-300 text-amber-300" />
          <span>{isReviewed ? 'Değerlendirmeyi Güncelle' : 'Değerlendir'}</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/kesfet')}
          className="w-full py-3 rounded-2xl bg-white border border-stone-200 text-stone-700 font-bold text-sm hover:bg-stone-100 transition-colors"
        >
          Keşfet'e Dön
        </button>
      </div>

      {/* Review Dialog Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-stone-900">Takas Partnerini Değerlendir</h3>
              <p className="text-xs text-stone-500">Aslı T. ile gerçekleştirdiğin takası puanla</p>
            </div>

            {/* Stars */}
            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 text-2xl transition-transform active:scale-125"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Comment */}
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">Yorumunuz</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:border-emerald-600 focus:outline-hidden resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="flex-1 py-3 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold hover:bg-stone-200"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleSubmitReview}
                className="flex-1 py-3 rounded-xl bg-emerald-800 text-white text-xs font-bold hover:bg-emerald-900 shadow-xs"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

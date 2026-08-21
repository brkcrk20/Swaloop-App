import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listingService, uploadListingImages } from '../../services/listingService';
import { supabase } from '../../lib/supabase';
import { impactService } from '../../services/impactService';
import { CATEGORIES } from '../../constants';
import { CategoryId, ProductCondition } from '../../types';
import { useApp, useAuthUser } from '../../context/AppContext';
import { ImpactCard } from '../../components/common/ImpactCard';
import {
  ArrowLeft,
  Camera,
  Upload,
  Plus,
  X,
  CheckCircle2,
  Leaf,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const CreateListingPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const currentUser = useAuthUser();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<CategoryId>('electronics');
  const [description, setDescription] = useState('');

  // images: ekranda gösterilen önizleme URL'leri (gerçek dosya seçilirse
  // geçici bir object URL, örnek görsel seçilirse doğrudan uzak URL).
  // imageFiles: images ile AYNI INDEX'te — o slot gerçek bir dosyaysa
  // File objesini tutar, örnek görselse null'dur. Yayınlarken sadece
  // File olan slotlar Supabase Storage'a gerçekten yüklenir.
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bileşen unmount olduğunda kullanılmayan object URL'leri bellekten temizle
  useEffect(() => {
    return () => {
      images.forEach((img, idx) => {
        if (imageFiles[idx]) URL.revokeObjectURL(img);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [condition, setCondition] = useState<ProductCondition>('very_good');
  const [lookingFor, setLookingFor] = useState('');
  const [deliveryOptions, setDeliveryOptions] = useState<('in_person' | 'cargo' | 'safe_point')[]>([
    'in_person',
    'safe_point',
  ]);

  // Live estimated SVS environmental impact
  const liveImpact = impactService.calculateEstimatedImpact(categoryId, condition);

  const handleAddSampleImage = (url: string) => {
    if (images.length >= 6) {
      showToast('Limit Aşıldı', 'En fazla 6 görsel ekleyebilirsiniz.', 'warning');
      return;
    }
    setImages((prev) => [...prev, url]);
    setImageFiles((prev) => [...prev, null]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    e.target.value = ''; // aynı dosyayı tekrar seçebilmek için input'u sıfırla

    if (!selected.length) return;

    const remainingSlots = 6 - images.length;
    if (remainingSlots <= 0) {
      showToast('Limit Aşıldı', 'En fazla 6 görsel ekleyebilirsiniz.', 'warning');
      return;
    }

    const oversized = selected.find((f) => f.size > 5 * 1024 * 1024);
    if (oversized) {
      showToast('Dosya Çok Büyük', `${oversized.name} 5MB sınırını aşıyor.`, 'warning');
    }

    const validFiles = selected
      .filter((f) => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024)
      .slice(0, remainingSlots);

    if (!validFiles.length) return;

    const previews = validFiles.map((f) => URL.createObjectURL(f));
    setImages((prev) => [...prev, ...previews]);
    setImageFiles((prev) => [...prev, ...validFiles]);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => {
      if (imageFiles[index]) URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToggleDelivery = (opt: 'in_person' | 'cargo' | 'safe_point') => {
    setDeliveryOptions((prev) =>
      prev.includes(opt)
        ? prev.length > 1
          ? prev.filter((o) => o !== opt)
          : prev
        : [...prev, opt]
    );
  };

  const [isPublishing, setIsPublishing] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

  const handlePublish = async () => {
    if (!title.trim() || !lookingFor.trim() || images.length === 0) {
      showToast('Eksik Bilgi', 'Lütfen tüm zorunlu alanları doldurun.', 'warning');
      return;
    }

    setIsPublishing(true);

    // Gerçek dosya seçilen slotları Supabase Storage'a yükle; örnek
    // görsel seçilen slotlar (imageFiles[i] === null) olduğu gibi kalır.
    let finalImages = images;
    const pendingFiles = imageFiles.filter((f): f is File => f !== null);

    if (pendingFiles.length > 0) {
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        setIsPublishing(false);
        showToast(
          'Oturum Sona Ermiş',
          'Fotoğraf yüklemek için tekrar giriş yapmanız gerekiyor. Lütfen çıkış yapıp telefon numaranızla tekrar giriş yapın.',
          'error'
        );
        return;
      }

      setIsUploadingPhotos(true);
      const uploadResults = await uploadListingImages(currentUser.id, pendingFiles);
      setIsUploadingPhotos(false);

      let uploadIdx = 0;
      const merged: string[] = [];
      images.forEach((img, i) => {
        if (imageFiles[i]) {
          const uploadedUrl = uploadResults[uploadIdx];
          uploadIdx++;
          if (uploadedUrl) merged.push(uploadedUrl);
          // uploadedUrl null ise (yükleme başarısız oldu) bu fotoğraf atlanır
        } else {
          merged.push(img);
        }
      });

      const failedCount = pendingFiles.length - uploadResults.filter(Boolean).length;
      if (failedCount > 0) {
        showToast(
          'Bazı Fotoğraflar Yüklenemedi',
          `${failedCount} fotoğraf yüklenemedi, ilan geri kalan fotoğraflarla yayınlanıyor.`,
          'warning'
        );
      }

      if (merged.length === 0) {
        setIsPublishing(false);
        showToast('Hata', 'Hiçbir fotoğraf yüklenemedi. Lütfen tekrar deneyin.', 'error');
        return;
      }

      finalImages = merged;
    }

    const newListing = await listingService.createListing({
      userId: currentUser.id,
      title,
      description: description || `${title} temiz durumda, takasa uygundur.`,
      categoryId,
      images: finalImages,
      condition,
      lookingFor,
      deliveryOptions,
      location: {
        city: currentUser.city,
        district: currentUser.district,
        distanceKm: 0.8,
      },
      user: {
        id: currentUser.id,
        reviewCount: currentUser.trustProfile.reviewCount,
        averageRating: currentUser.trustProfile.averageRating,
        completedTrades: currentUser.trustProfile.successfulTradesCount,
        fullName: currentUser.fullName,
        avatarUrl: currentUser.avatarUrl,
        trustScore: currentUser.trustProfile.score,
        city: currentUser.city,
        district: currentUser.district,
        isVerified: currentUser.isVerified,
      },
    });

    setIsPublishing(false);

    if (!newListing) {
      showToast('Hata', 'İlan yayınlanırken bir sorun oluştu. Lütfen tekrar deneyin.', 'error');
      return;
    }

    showToast('İlanın Yayında! 🎉', 'Sana uygun takas teklifleri bekleyebilirsin.', 'success');
    navigate(`/ilan/${newListing.id}`);
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-28 text-stone-900">
      <div className="max-w-md md:max-w-2xl mx-auto px-4 pt-3 space-y-5">
        {/* Header & Step progress */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (step > 1) setStep((prev) => (prev - 1) as 1 | 2);
              else navigate(-1);
            }}
            className="w-10 h-10 rounded-2xl bg-white border border-stone-200 text-stone-700 flex items-center justify-center hover:bg-stone-100 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Adım {step} / 3
            </span>
          </div>
        </div>

        {/* STEP 1: Photos & Basic Info */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 font-display">
                Ne Takas Etmek İstiyorsun?
              </h1>
              <p className="text-xs text-stone-500 mt-0.5">
                Kullanmadığın ürünün fotoğraflarını ve temel bilgilerini ekle.
              </p>
            </div>

            {/* Images Grid */}
            <div className="bg-white rounded-3xl p-4 border border-stone-200 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                Ürün Fotoğrafları ({images.length}/6)
              </label>

              <div className="grid grid-cols-3 gap-2">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 group"
                  >
                    <img src={img} alt="Product preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-stone-950/70 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {images.length < 6 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative aspect-square rounded-2xl border-2 border-dashed border-stone-300 hover:border-emerald-600 bg-stone-50 flex flex-col items-center justify-center text-center p-2 transition-colors cursor-pointer"
                  >
                    <Camera className="w-6 h-6 text-stone-400 mb-1" />
                    <span className="text-[10px] font-semibold text-stone-500">Fotoğraf Ekle</span>
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Sample Quick Pick Presets */}
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-stone-400 block mb-1.5">
                  Örnek Ürün Görselleri:
                </span>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {[
                    {
                      label: '💻 Laptop',
                      url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
                    },
                    {
                      label: '📷 Fotoğraf Mak.',
                      url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500',
                    },
                    {
                      label: '🚲 Bisiklet',
                      url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500',
                    },
                    {
                      label: '🎸 Gitar',
                      url: 'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=500',
                    },
                    {
                      label: '📚 Kitap Seti',
                      url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500',
                    },
                  ].map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleAddSampleImage(preset.url)}
                      className="px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-[11px] font-medium text-stone-700 whitespace-nowrap transition-colors"
                    >
                      + {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Title & Category */}
            <div className="bg-white rounded-3xl p-4 border border-stone-200 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  İlan Başlığı *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn: Apple Watch Series 7 45mm"
                  className="w-full px-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 focus:border-emerald-600 focus:outline-hidden text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Kategori *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value as CategoryId)}
                  className="w-full px-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 focus:border-emerald-600 focus:outline-hidden text-sm font-semibold"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Açıklama (Opsiyonel)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ürünün durumu, kutusu, aksesuarları hakkında bilgi verin..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 focus:border-emerald-600 focus:outline-hidden text-xs sm:text-sm font-medium"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={!title.trim() || images.length === 0}
              onClick={() => setStep(2)}
              className="w-full py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>Sonraki Adım: Takas Tercihleri</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Condition & Looking For & Delivery */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 font-display">
                Kondisyon & Aradığın Ürün
              </h1>
              <p className="text-xs text-stone-500 mt-0.5">
                Karşılığında ne takas etmek istediğini belirt.
              </p>
            </div>

            {/* Condition Selection */}
            <div className="bg-white rounded-3xl p-4 border border-stone-200 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Ürün Kondisyonu
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: 'zero', title: 'Sıfır', desc: 'Kutusu açılmamış, kullanılmamış' },
                  { id: 'like_new', title: 'Sıfır Gibi', desc: 'Kusursuz, çiziksiz durumda' },
                  { id: 'very_good', title: 'Çok İyi', desc: 'Çok az kullanılmış, temiz' },
                  { id: 'good', title: 'İyi', desc: 'Normal kullanım izleri mevcut' },
                  { id: 'acceptable', title: 'Makul', desc: 'Çalışır durumda, yıpranmış' },
                ].map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setCondition(c.id as ProductCondition)}
                    className={`p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                      condition === c.id
                        ? 'border-emerald-600 bg-emerald-50/60'
                        : 'border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900">{c.title}</span>
                      {condition === c.id && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <span className="text-[11px] text-stone-500 block mt-0.5">{c.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Looking For Input */}
            <div className="bg-white rounded-3xl p-4 border border-stone-200 space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Ne ile Takas Etmek İstersin? *
                </label>
                <input
                  type="text"
                  value={lookingFor}
                  onChange={(e) => setLookingFor(e.target.value)}
                  placeholder="Örn: Bisiklet, Nintendo Switch veya benzer değerde tablet"
                  className="w-full px-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 focus:border-emerald-600 focus:outline-hidden text-sm font-semibold"
                />
                <span className="text-[11px] text-stone-400 block mt-1">
                  İpucu: Net ifadeler yazarsan akıllı algoritmamız sana uygun takasları daha hızlı
                  önerir.
                </span>
              </div>
            </div>

            {/* Delivery Methods */}
            <div className="bg-white rounded-3xl p-4 border border-stone-200 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Teslimat Tercihleri
              </label>

              <div className="grid grid-cols-2 gap-2">
                <div
                  onClick={() => handleToggleDelivery('in_person')}
                  className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                    deliveryOptions.includes('in_person')
                      ? 'border-emerald-600 bg-emerald-50/60'
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold block text-stone-900">Elden Buluşma</span>
                    <span className="text-[10px] text-stone-500">Güvenli noktalarda</span>
                  </div>
                  {deliveryOptions.includes('in_person') && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                </div>

                <div
                  onClick={() => handleToggleDelivery('cargo')}
                  className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                    deliveryOptions.includes('cargo')
                      ? 'border-emerald-600 bg-emerald-50/60'
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold block text-stone-900">Kargo ile</span>
                    <span className="text-[10px] text-stone-500">Alıcı / Gönderici</span>
                  </div>
                  {deliveryOptions.includes('cargo') && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={!lookingFor.trim()}
              onClick={() => setStep(3)}
              className="w-full py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>Sonraki Adım: Çevresel Etki & Yayınla</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 3: Instant SVS Environmental Impact Preview & Confirm */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 font-display">
                Çevresel Etki & Onay
              </h1>
              <p className="text-xs text-stone-500 mt-0.5">
                Bu ürünü yeniden dolaşıma soktuğunda doğaya kazandıracağın fayda:
              </p>
            </div>

            {/* Instant Calculated SVS Impact Card */}
            <ImpactCard impact={liveImpact} variant="detailed" />

            {/* Listing Summary Preview Box */}
            <div className="bg-white rounded-3xl p-4 border border-stone-200 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
                İlan Özeti
              </span>

              <div className="flex gap-3 items-center">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-stone-100 shrink-0">
                  <img src={images[0]} alt="Product" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">{title}</h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    İstenen: <span className="font-semibold text-emerald-900">{lookingFor}</span>
                  </p>
                  <span className="text-[11px] text-stone-400 block mt-0.5">
                    {currentUser.district}, {currentUser.city}
                  </span>
                </div>
              </div>
            </div>

            {/* Zero Cash Reminder */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Nakit Para Olmadan Takas Güvencesi</strong>
                Swaloop'ta para transferi yapılmaz. Ürününü teslim ettiğinde karşı tarafın da onayını
                alarak güvenle takasını tamamlarsın.
              </div>
            </div>

            <button
              type="button"
              onClick={handlePublish}
              disabled={isPublishing}
              className="w-full py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-base shadow-lg shadow-emerald-950/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60"
            >
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>
                {isUploadingPhotos
                  ? 'Fotoğraflar yükleniyor...'
                  : isPublishing
                  ? 'Yayınlanıyor...'
                  : 'İlanı Ücretsiz Yayınla'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { CATEGORIES } from '../../constants';
import { CategoryId } from '../../types';
import { ArrowLeft, Camera, Check, User, MapPin, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CreateProfilePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setCurrentUser, showToast } = useApp();

  const state = (location.state as { phone?: string }) || {};
  const phone = state.phone || '+90 532 890 12 34';

  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('İstanbul');
  const [district, setDistrict] = useState('Kadıköy');
  const [avatarUrl, setAvatarUrl] = useState(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
  );
  const [selectedInterests, setSelectedInterests] = useState<CategoryId[]>(['elektronik', 'spor']);
  const [selectedWanted, setSelectedWanted] = useState<CategoryId[]>(['elektronik', 'kitap_muzik']);

  const toggleInterest = (id: CategoryId) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleWanted = (id: CategoryId) => {
    setSelectedWanted((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleAvatarSelect = () => {
    // In demo, rotate sample profile avatars
    const samples = [
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
    ];
    const nextAvatar = samples[(samples.indexOf(avatarUrl) + 1) % samples.length];
    setAvatarUrl(nextAvatar);
    showToast('Profil Fotoğrafı Seçildi', 'Görsel güncellendi.', 'info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('Eksik Bilgi', 'Lütfen adınızı ve soyadınızı giriniz.', 'warning');
      return;
    }

    const newUser = await authService.createProfile({
      phone,
      fullName,
      city,
      district,
      avatarUrl,
      interests: selectedInterests,
      wantedCategories: selectedWanted,
    });
    
    if (!newUser) {
  showToast(
    'Hata',
    'Profil oluşturulamadı. Lütfen tekrar deneyin.',
    'error'
  );
  return;
}

    setCurrentUser(newUser);
    showToast('Profil Oluşturuldu! 🎉', 'Swaloop dünyasına hoş geldin.', 'success');
    navigate('/kesfet');
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col justify-between p-6 max-w-md mx-auto">
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
            Adım 3 / 3
          </span>
        </div>

        <div className="space-y-2 mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-display tracking-tight">
            Profilini Oluştur
          </h1>
          <p className="text-sm text-stone-500">
            Topluluğun seni tanıması ve akıllı takas eşleşmeleri için birkaç bilgi ekle.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar Upload Bubble */}
          <div className="flex flex-col items-center justify-center my-2">
            <div className="relative group cursor-pointer" onClick={handleAvatarSelect}>
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-emerald-100">
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center border-2 border-white shadow-md group-hover:scale-110 transition-transform">
                <Camera className="w-4 h-4" />
              </div>
            </div>
            <button
              type="button"
              onClick={handleAvatarSelect}
              className="text-xs font-semibold text-emerald-700 hover:underline mt-2 cursor-pointer"
            >
              Fotoğraf Değiştir
            </button>
          </div>

          {/* Ad Soyad */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Ad Soyad
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Adını ve soyadını gir"
                required
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border border-stone-200 focus:border-emerald-600 focus:outline-hidden text-sm font-semibold shadow-xs"
              />
            </div>
          </div>

          {/* Şehir & İlçe */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Şehir
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-3.5 rounded-2xl bg-white border border-stone-200 focus:border-emerald-600 focus:outline-hidden text-sm font-semibold shadow-xs"
              >
                <option value="İstanbul">İstanbul</option>
                <option value="Ankara">Ankara</option>
                <option value="İzmir">İzmir</option>
                <option value="Bursa">Bursa</option>
                <option value="Antalya">Antalya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                İlçe
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="İlçeni gir"
                className="w-full px-3.5 py-3.5 rounded-2xl bg-white border border-stone-200 focus:border-emerald-600 focus:outline-hidden text-sm font-semibold shadow-xs"
              />
            </div>
          </div>

          {/* İlgi Alanların */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              İlgi Alanların & Sahip Olduğun Kategoriler
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedInterests.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleInterest(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {isSelected && '✓ '}
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={!fullName.trim()}
            className="w-full py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-base shadow-md shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all cursor-pointer mt-4"
          >
            Kaydı Tamamla ve Keşfet
          </button>
        </form>
      </div>
    </div>
  );
};

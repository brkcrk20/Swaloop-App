import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, useAuthUser } from '../../context/AppContext';
import { authService } from '../../services/authService';
import { CATEGORIES } from '../../constants';
import { ArrowLeft, Camera, ShieldCheck, Check } from 'lucide-react';

export const EditProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { setCurrentUser, showToast } = useApp();
  const currentUser = useAuthUser();

  const [fullName, setFullName] = useState(currentUser.fullName);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [city, setCity] = useState(currentUser.city);
  const [district, setDistrict] = useState(currentUser.district);
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl);
  const [interests, setInterests] = useState(currentUser.interests);
  const [wantedCategories, setWantedCategories] = useState(currentUser.wantedCategories);

  const toggleInterest = (id: any) => {
    if (interests.includes(id)) {
      setInterests(interests.filter((i) => i !== id));
    } else {
      setInterests([...interests, id]);
    }
  };

  const toggleWanted = (id: any) => {
    if (wantedCategories.includes(id)) {
      setWantedCategories(wantedCategories.filter((i) => i !== id));
    } else {
      setWantedCategories([...wantedCategories, id]);
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const updated = await authService.updateUserProfile({
      fullName,
      bio,
      city,
      district,
      avatarUrl,
      interests,
      wantedCategories,
    });
    setIsSaving(false);

    if (!updated) {
      showToast('Hata', 'Profil güncellenirken bir sorun oluştu.', 'error');
      return;
    }

    setCurrentUser(updated);
    showToast('Profil Güncellendi', 'Bilgileriniz başarıyla kaydedildi.', 'success');
    navigate('/profil');
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24 text-stone-900">
      <div className="max-w-md md:max-w-xl mx-auto px-4 pt-3 space-y-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-stone-900">Profili Düzenle</h1>
            <p className="text-xs text-stone-500">Kişisel bilgilerinizi ve ilgi alanlarınızı güncelleyin</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Avatar Edit */}
          <div className="bg-white rounded-2xl border border-stone-200/90 p-4 flex items-center gap-4">
            <div className="relative">
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-16 h-16 rounded-full object-cover border-2 border-emerald-700"
              />
              <button
                type="button"
                onClick={() =>
                  setAvatarUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80')
                }
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-emerald-800 text-white shadow-sm"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 text-xs">
              <span className="font-bold text-stone-900 block mb-0.5">Profil Fotoğrafı</span>
              <span className="text-stone-500">Takas güvenliği için net bir profil resmi tercih ediniz.</span>
            </div>
          </div>

          {/* Form fields */}
          <div className="bg-white rounded-2xl border border-stone-200/90 p-4 space-y-3">
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">Ad Soyad</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-hidden focus:border-emerald-700"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">Biyografi & Takas Tarzı</label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-hidden focus:border-emerald-700 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">İl</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-hidden focus:border-emerald-700"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">İlçe</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-hidden focus:border-emerald-700"
                />
              </div>
            </div>
          </div>

          {/* Interests selection */}
          <div className="bg-white rounded-2xl border border-stone-200/90 p-4 space-y-2">
            <label className="text-xs font-bold text-stone-800 block">Dolaşıma Soktuğun Kategoriler</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => {
                const isSelected = interests.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleInterest(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 ${
                      isSelected
                        ? 'bg-emerald-800 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-60"
          >
            {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </button>
        </form>
      </div>
    </div>
  );
};

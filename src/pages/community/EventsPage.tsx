import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Sparkles,
  CheckCircle2,
  Share2,
  Clock,
  Wrench,
  Shirt,
  BookOpen,
} from 'lucide-react';

export const EventsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();

  const [joinedEvents, setJoinedEvents] = useState<string[]>(['event-1']);

  const events = [
    {
      id: 'event-1',
      title: 'Kadıköy Açık Hava Takas Buluşması',
      category: 'Genel Takas',
      date: '25 Mayıs 2024, Cumartesi',
      time: '14:00 - 18:00',
      location: 'Moda Sahil Parkı, Kadıköy / İstanbul',
      attendeeCount: 68,
      icon: '🌿',
      description: 'Kullanmadığınız kitap, giysi ve hobi eşyalarınızı getirin, toplulukla tanışarak doğrudan elden takaslayın.',
      tags: ['Sıfır Atık', 'Yüz Yüze Takas', 'SVS Puanı'],
    },
    {
      id: 'event-2',
      title: 'Beşiktaş Tamir Kafesi & Elektronik Kurtarma',
      category: 'Tamir & Yenileme',
      date: '01 Haziran 2024, Cumartesi',
      time: '13:00 - 17:00',
      location: 'Abbasağa Parkı Amfi Tiyatro, Beşiktaş',
      attendeeCount: 42,
      icon: '🔧',
      description: 'Ufak arızalı kulaklık, lamba ve küçük ev aletlerinizi gönüllü ustalarla birlikte tamir edin veya takaslayın.',
      tags: ['Tamir', 'Elektronik', 'Döngüsel Ekonomi'],
    },
    {
      id: 'event-3',
      title: 'Vintage Giyim & Moda Swap Partisi',
      category: 'Giyim & Moda',
      date: '08 Haziran 2024, Cumartesi',
      time: '15:00 - 19:00',
      location: 'Cihangir Sanat Bahçesi, Beyoğlu',
      attendeeCount: 94,
      icon: '👗',
      description: 'Gardırobunuzu yenileyin! En fazla 5 parça temiz vintage kıyafet getirin, beğendiğiniz parçalarla değiştirin.',
      tags: ['Sürdürülebilir Moda', 'Tekstil Tasarrufu'],
    },
  ];

  const handleToggleJoin = (eventId: string, title: string) => {
    if (joinedEvents.includes(eventId)) {
      setJoinedEvents((prev) => prev.filter((id) => id !== eventId));
      showToast('Katılım İptal Edildi', undefined, 'info');
    } else {
      setJoinedEvents((prev) => [...prev, eventId]);
      showToast('Etkinliğe Katıldınız! 🎉', `${title} için kaydınız oluşturuldu.`, 'success');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24 text-stone-900">
      <div className="max-w-md md:max-w-xl mx-auto px-4 pt-4 space-y-5">
        {/* Top Header Matching Screen 19 */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl bg-white border border-stone-200 text-stone-700 flex items-center justify-center hover:bg-stone-100 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-extrabold text-stone-900 font-display">Etkinlikler</h1>
          <div className="w-10" />
        </div>

        {/* Hero Banner Matching Screen 19 */}
        <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-950 text-white rounded-3xl p-6 shadow-md relative overflow-hidden space-y-2">
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <Users className="w-4 h-4" />
            <span>Topluluk Buluşmaları</span>
          </div>
          <h2 className="text-xl font-black text-white font-display">
            Takas buluşmaları ve etkinliklerle toplulukla bir araya gel.
          </h2>
          <p className="text-xs text-emerald-100/80 leading-relaxed">
            Şehrindeki açık hava takas pazarlarına, tamir kafelerine katıl; eşyalarını elden güvenle takaslarken yeni arkadaşlar edin.
          </p>
        </div>

        {/* Event Cards List */}
        <div className="space-y-4 pt-1">
          {events.map((event) => {
            const isJoined = joinedEvents.includes(event.id);

            return (
              <div
                key={event.id}
                className="bg-white rounded-3xl border border-stone-200/90 p-5 shadow-xs space-y-3.5 hover:border-emerald-300 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-2xl flex items-center justify-center shrink-0 shadow-xs">
                    {event.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mb-1">
                      {event.category}
                    </span>
                    <h3 className="text-sm font-bold text-stone-900 leading-snug">
                      {event.title}
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed">
                  {event.description}
                </p>

                <div className="space-y-1.5 text-xs text-stone-600 pt-1 border-t border-stone-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>{event.date} • {event.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="font-semibold text-stone-800">
                      {event.attendeeCount + (isJoined ? 1 : 0)} kişi katılıyor
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleToggleJoin(event.id, event.title)}
                    className={`flex-1 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isJoined
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                        : 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs'
                    }`}
                  >
                    {isJoined ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span>Katılıyorsun (Kayıtlı)</span>
                      </>
                    ) : (
                      <span>Etkinliğe Katıl</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

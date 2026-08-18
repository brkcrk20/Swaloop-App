import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { communityService } from '../../services/communityService';
import { CommunityPost, CommunityEvent } from '../../types';
import {
  Users,
  Heart,
  MessageSquare,
  Calendar,
  MapPin,
  Share2,
  Leaf,
  Trophy,
  Sparkles,
  ArrowLeftRight,
  Plus,
  CheckCircle,
} from 'lucide-react';

export const CommunityPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'stories' | 'events' | 'leaderboard'>('stories');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [events, setEvents] = useState<CommunityEvent[]>(() => communityService.getEvents());

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoadingPosts(true);
      const data = await communityService.getPosts(currentUser.id);
      if (!cancelled) {
        setPosts(data);
        setIsLoadingPosts(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentUser.id]);

  const handleLikePost = async (postId: string) => {
    const updated = await communityService.toggleLikePost(postId, currentUser.id);
    if (updated) {
      setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
    }
  };

  const handleToggleEventAttendance = (eventId: string) => {
    const updated = communityService.toggleEventAttendance(eventId);
    if (updated) {
      setEvents(events.map((e) => (e.id === eventId ? updated : e)));
      showToast(
        updated.isAttending ? 'Etkinliğe Katılımınız Alındı!' : 'Katılım iptal edildi',
        updated.isAttending ? `${updated.title} takviminize eklendi.` : undefined,
        'success'
      );
    }
  };

  const leaderboards = [
    { rank: 1, name: 'Berke Çelik', avatar: currentUser.avatarUrl, co2: 127.4, trades: 7, isMe: true },
    { rank: 2, name: 'Zeynep Kaya', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200', co2: 112.8, trades: 6 },
    { rank: 3, name: 'Mehmet Demir', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', co2: 98.2, trades: 5 },
    { rank: 4, name: 'Elif Arslan', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200', co2: 84.5, trades: 4 },
    { rank: 5, name: 'Can Yılmaz', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200', co2: 65.0, trades: 3 },
  ];

  return (
    <div className="min-h-screen bg-stone-50 pb-28 text-stone-900">
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 pt-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="p-1.5 rounded-xl bg-emerald-800 text-white">
                <Users className="w-4 h-4" />
              </span>
              <h1 className="text-xl font-bold text-stone-900 tracking-tight">Swaloop Topluluğu</h1>
            </div>
            <p className="text-xs text-stone-500">Takas hikayeleri, yerel buluşmalar ve lider tablosu</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-200/60 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('stories')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'stories' ? 'bg-white text-emerald-950 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Takas Hikayeleri
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('events')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'events' ? 'bg-white text-emerald-950 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Etkinlikler ({events.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'leaderboard' ? 'bg-white text-emerald-950 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Lider Tablosu
          </button>
        </div>

        {/* 1. Stories Tab */}
        {activeTab === 'stories' && isLoadingPosts && (
          <div className="py-16 text-center text-xs text-stone-500">Gönderiler yükleniyor...</div>
        )}

        {activeTab === 'stories' && !isLoadingPosts && posts.length === 0 && (
          <div className="py-16 text-center text-xs text-stone-500">Henüz hiç gönderi yok.</div>
        )}

        {activeTab === 'stories' && !isLoadingPosts && posts.length > 0 && (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-3xl border border-stone-200/90 p-5 shadow-xs space-y-3"
              >
                {/* Author Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={post.author.avatarUrl}
                      alt={post.author.fullName}
                      className="w-10 h-10 rounded-full object-cover border border-stone-200"
                    />
                    <div>
                      <h3 className="text-xs font-bold text-stone-900">{post.author.fullName}</h3>
                      <span className="text-[10px] text-stone-400">
                        {post.author.district}, {post.author.city} • {post.createdAt}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                    ★ {(post.author.trustProfile?.score ?? 4.8).toFixed(1)}
                  </span>
                </div>

                {/* Content */}
                <div>
                  <h4 className="text-sm font-bold text-stone-900 mb-1">{post.title}</h4>
                  <p className="text-xs text-stone-700 leading-relaxed">{post.content}</p>
                </div>

                {/* Trade Story Highlight Box */}
                {post.tradeStory && (
                  <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-stone-800">{post.tradeStory.itemGiven}</span>
                      <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-700" />
                      <span className="font-semibold text-stone-800">{post.tradeStory.itemReceived}</span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                      +{post.tradeStory.co2Saved} kg CO₂e
                    </span>
                  </div>
                )}

                {/* Images */}
                {post.images && post.images.length > 0 && (
                  <div className="aspect-video rounded-2xl overflow-hidden bg-stone-100">
                    <img src={post.images[0]} alt="Hikaye Fotoğrafı" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Footer buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs text-stone-500">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleLikePost(post.id)}
                      className={`flex items-center gap-1 font-semibold transition-colors cursor-pointer ${
                        post.isLiked ? 'text-rose-600' : 'text-stone-600 hover:text-rose-600'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                      <span>{post.likesCount}</span>
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-stone-600 hover:text-stone-900 font-semibold"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{post.commentsCount}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. Events Tab */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-3xl border border-stone-200/90 overflow-hidden shadow-xs"
              >
                <div className="aspect-video sm:aspect-21/9 relative bg-stone-900">
                  <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover opacity-90" />
                  <div className="absolute top-3 left-3 bg-emerald-900/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {event.category === 'swap_party' ? 'Takas Partisi' : 'Tamir Kafesi'}
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="text-base font-bold text-stone-900">{event.title}</h3>
                    <p className="text-xs text-stone-600 leading-relaxed mt-1">{event.description}</p>
                  </div>

                  <div className="space-y-1.5 text-xs text-stone-600 bg-stone-50 p-3 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-800 shrink-0" />
                      <span>{event.date} • {event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-800 shrink-0" />
                      <span>{event.locationName} ({event.district}, {event.city})</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-stone-500 font-semibold">
                      {event.attendeesCount} kişi katılıyor
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleEventAttendance(event.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        event.isAttending
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-emerald-800 text-white hover:bg-emerald-900 shadow-xs'
                      }`}
                    >
                      {event.isAttending ? '✓ Katılıyorsun' : 'Katıl & Takvime Ekle'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 3. Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="bg-white rounded-3xl border border-stone-200/90 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-stone-900">Ayın SVS Karbon Liderleri</h3>
              </div>
              <span className="text-xs text-stone-400">İstanbul / Kadıköy</span>
            </div>

            <div className="space-y-2">
              {leaderboards.map((user) => (
                <div
                  key={user.rank}
                  className={`p-3 rounded-2xl flex items-center justify-between border transition-all ${
                    user.isMe
                      ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20'
                      : 'bg-stone-50 border-stone-200/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                        user.rank === 1
                          ? 'bg-amber-400 text-amber-950'
                          : user.rank === 2
                          ? 'bg-stone-300 text-stone-800'
                          : user.rank === 3
                          ? 'bg-amber-700 text-white'
                          : 'text-stone-400'
                      }`}
                    >
                      {user.rank}
                    </span>
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover border border-stone-200"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-stone-900">
                        {user.name} {user.isMe && '(Sen)'}
                      </h4>
                      <span className="text-[10px] text-stone-500">{user.trades} başarılı takas</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-extrabold text-emerald-800 block">
                      +{user.co2} kg
                    </span>
                    <span className="text-[9px] text-stone-400 uppercase">CO₂e Kurtarıldı</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

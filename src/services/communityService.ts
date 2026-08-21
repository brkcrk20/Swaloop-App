import { CommunityPost, CommunityEvent, Badge, PaperclipStage, MysterySwapItem } from '../types';
import {
  INITIAL_EVENTS,
  INITIAL_MYSTERY_ITEMS,
} from '../data/mockData';
import { INITIAL_BADGES, PAPERCLIP_STAGES } from '../constants';
import { supabase } from '../lib/supabase';
import { mapProfile } from './authService';
import type { TablesInsert } from '../types/supabase';

// ─────────────────────────────────────────────────────────────────────────
// NOT: Sadece "gönderiler" (posts) kısmı gerçek Supabase'e bağlandı (bkz.
// swaloop-devam-plani.md §11). Etkinlikler (`eventsStore`, ayrıca
// `EventsPage.tsx`'in kendi hardcoded verisi de var), rozetler
// (`badgesStore`, ayrıca `BadgesPage.tsx`'in kendi hardcoded verisi de
// var), ataş meydan okuması (paperclip) ve gizemli kutu (mystery swap)
// HÂLÂ tamamen mock veri — bunlar bu turun kapsamı dışında bırakıldı.
//
// `likesCount`/`commentsCount` DB'de `community_posts` tablosunda düz
// sayaç kolonları; beğeni sayısı bir Postgres trigger'ıyla `post_likes`
// tablosuyla senkron tutuluyor (bkz. migration
// 20260818170000_create_community_posts_tables.sql). Yorum (comment)
// özelliği için hiçbir UI olmadığından `comments_count` şimdilik her
// zaman 0 dönüyor.
// ─────────────────────────────────────────────────────────────────────────

let eventsStore: CommunityEvent[] = [...INITIAL_EVENTS];
let badgesStore: Badge[] = [...INITIAL_BADGES];
let paperclipStore: PaperclipStage[] = [...PAPERCLIP_STAGES];
let mysteryItemsStore: MysterySwapItem[] = [...INITIAL_MYSTERY_ITEMS];

function mapPost(row: any, currentUserId?: string): CommunityPost {
  const tradeStory =
    row.trade_item_given || row.trade_item_received
      ? {
          itemGiven: row.trade_item_given ?? '',
          itemReceived: row.trade_item_received ?? '',
          co2Saved: row.trade_co2_saved ?? 0,
        }
      : undefined;

  const likedByIds: string[] = Array.isArray(row.post_likes)
    ? row.post_likes.map((l: any) => l.user_id)
    : [];

  return {
    id: row.id,
    author: mapProfile(row.author),
    title: row.title,
    content: row.content,
    tradeStory,
    likesCount: row.likes_count ?? 0,
    commentsCount: row.comments_count ?? 0,
    isLiked: currentUserId ? likedByIds.includes(currentUserId) : false,
    createdAt: row.created_at,
    tags: Array.isArray(row.tags) ? row.tags : [],
  };
}

// Profil join'lerinde `profiles(*)` kullanılmıyor: o satır `phone` kolonunu da
// içeriyor ve `*` ile çekildiğinde başka kullanıcıların telefon numarası
// istemciye iniyordu. RLS satır bazlıdır, kolon bazlı değildir — bu yüzden
// hangi kolonların istendiği burada açıkça sınırlanıyor.
const PROFILE_COLS = 'id, full_name, avatar_url, city, district, bio, created_at';

const POST_SELECT = `*, author:profiles(${PROFILE_COLS}), post_likes(user_id)`;

export const communityService = {
  async getPosts(currentUserId?: string): Promise<CommunityPost[]> {
    const { data, error } = await supabase
      .from('community_posts')
      .select(POST_SELECT)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Gönderiler getirilemedi:', error);
      return [];
    }

    return (data ?? []).map((row) => mapPost(row, currentUserId));
  },

  async createPost(
    authorId: string,
    title: string,
    content: string,
    tags: string[],
    tradeStory?: CommunityPost['tradeStory']
  ): Promise<CommunityPost | undefined> {
    const insert: TablesInsert<'community_posts'> = {
      author_id: authorId,
      title,
      content,
      tags,
      trade_item_given: tradeStory?.itemGiven ?? null,
      trade_item_received: tradeStory?.itemReceived ?? null,
      trade_co2_saved: tradeStory?.co2Saved ?? null,
    };

    const { data, error } = await supabase
      .from('community_posts')
      .insert(insert)
      .select(POST_SELECT)
      .single();

    if (error || !data) {
      console.error('Gönderi oluşturulamadı:', error);
      return undefined;
    }

    return mapPost(data, authorId);
  },

  /**
   * Beğeniyi açar/kapatır. Beğeni sayısı `post_likes` tablosundaki bir
   * trigger ile otomatik güncellendiği için burada sadece satır
   * ekleniyor/siliniyor, `likes_count`'a elle dokunulmuyor.
   */
  async toggleLikePost(postId: string, userId: string): Promise<CommunityPost | undefined> {
    const { data: existing } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from('post_likes').delete().eq('id', existing.id);
      if (error) console.error('Beğeni kaldırılamadı:', error);
    } else {
      const insert: TablesInsert<'post_likes'> = { post_id: postId, user_id: userId };
      const { error } = await supabase.from('post_likes').insert(insert);
      if (error) console.error('Beğeni eklenemedi:', error);
    }

    const { data, error: fetchError } = await supabase
      .from('community_posts')
      .select(POST_SELECT)
      .eq('id', postId)
      .maybeSingle();

    if (fetchError || !data) {
      if (fetchError) console.error('Gönderi tekrar getirilemedi:', fetchError);
      return undefined;
    }

    return mapPost(data, userId);
  },

  getEvents(): CommunityEvent[] {
    return [...eventsStore];
  },

  getEventById(id: string): CommunityEvent | undefined {
    return eventsStore.find((e) => e.id === id);
  },

  toggleEventAttendance(eventId: string): CommunityEvent | undefined {
    const ev = eventsStore.find((e) => e.id === eventId);
    if (ev) {
      ev.isAttending = !ev.isAttending;
      ev.attendeesCount += ev.isAttending ? 1 : -1;
      return ev;
    }
    return undefined;
  },

  toggleRsvp(eventId: string): boolean {
    const ev = eventsStore.find((e) => e.id === eventId);
    if (ev) {
      ev.isAttending = !ev.isAttending;
      ev.attendeesCount += ev.isAttending ? 1 : -1;
      return ev.isAttending;
    }
    return false;
  },

  getBadges(): Badge[] {
    return [...badgesStore];
  },

  getPaperclipStages(): PaperclipStage[] {
    return [...paperclipStore];
  },

  advancePaperclipStage(): PaperclipStage[] {
    const currentIdx = paperclipStore.findIndex((s) => s.isCurrent);
    if (currentIdx !== -1 && currentIdx < paperclipStore.length - 1) {
      paperclipStore[currentIdx].isCurrent = false;
      paperclipStore[currentIdx].isCompleted = true;
      paperclipStore[currentIdx].dateCompleted = 'Bugün';

      paperclipStore[currentIdx + 1].isCurrent = true;
    }
    return [...paperclipStore];
  },

  getMysterySwapItems(): MysterySwapItem[] {
    return [...mysteryItemsStore];
  },

  drawMysterySwap(): MysterySwapItem {
    const randomIdx = Math.floor(Math.random() * mysteryItemsStore.length);
    return mysteryItemsStore[randomIdx];
  },
};

import { Conversation, Message, UserProfile } from '../types';
import { supabase } from '../lib/supabase';
import { mapProfile } from './authService';
import type { TablesInsert } from '../types/supabase';

// ─────────────────────────────────────────────────────────────────────────
// NOT: Bu dosya artık mockData yerine gerçek Supabase sorguları kullanıyor.
//
// DB'de daha önce `messages`/`conversations` tabloları hiç yoktu (bkz. plan
// §3 ve §6 madde 1). Bu turda eklenen
// `supabase/migrations/20260818140000_create_messaging_tables.sql` dosyası
// bu iki tabloyu ve RLS politikalarını oluşturuyor. BU MIGRATION HENÜZ
// CANLIYA UYGULANMADI — kullanıcının kendi ortamında `supabase db push`
// (veya CLI ile) çalıştırması gerekiyor, aksi halde aşağıdaki sorgular
// "relation does not exist" hatası verir. Bkz. güncellenmiş devam planı §5.4.
//
// Şema:
//  - `conversations`: iki katılımcı (participant_one_id/participant_two_id),
//    opsiyonel `related_listing_id` / `active_trade_offer_id`.
//  - `messages`: conversation_id + sender_id + content + type + is_read.
//
// Frontend'deki `Conversation.participant` alanı DAİMA "karşı taraf"ı
// (mevcut kullanıcı olmayanı) temsil ediyor — bu yüzden her sorguda
// `currentUserId` parametre olarak isteniyor, kimin "diğer taraf" olduğunu
// hesaplamak için.
// ─────────────────────────────────────────────────────────────────────────

type ConversationRow = {
  id: string;
  participant_one_id: string;
  participant_two_id: string;
  related_listing_id: string | null;
  active_trade_offer_id: string | null;
  created_at: string;
  updated_at: string;
  participant_one?: any;
  participant_two?: any;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: string;
  trade_offer_id: string | null;
  is_read: boolean;
  created_at: string;
  sender?: any;
};

const CONVERSATION_SELECT =
  '*, participant_one:profiles!conversations_participant_one_id_fkey(*), participant_two:profiles!conversations_participant_two_id_fkey(*)';

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function mapMessageRow(row: MessageRow): Message {
  const sender = row.sender ? mapProfile(row.sender) : null;

  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    senderName: sender?.fullName ?? '',
    senderAvatar: sender?.avatarUrl ?? '',
    content: row.content,
    timestamp: fmtTime(row.created_at),
    type: row.type as Message['type'],
    tradeOfferId: row.trade_offer_id ?? undefined,
    isRead: row.is_read,
  };
}

async function mapConversationRow(row: ConversationRow, currentUserId: string): Promise<Conversation> {
  const otherRow = row.participant_one_id === currentUserId ? row.participant_two : row.participant_one;
  const participant: UserProfile = mapProfile(otherRow);

  const { data: lastMsgRow } = await supabase
    .from('messages')
    .select('*, sender:profiles(*)')
    .eq('conversation_id', row.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { count: unreadCount } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', row.id)
    .eq('is_read', false)
    .neq('sender_id', currentUserId);

  const fallbackLastMessage: Message = {
    id: `placeholder-${row.id}`,
    conversationId: row.id,
    senderId: 'system',
    senderName: 'Swaloop',
    senderAvatar: '',
    content: 'Sohbet başlatıldı. Güvenli takas için lütfen sistem üzerinden ilerleyiniz.',
    timestamp: fmtTime(row.created_at),
    type: 'system_card',
    isRead: true,
  };

  return {
    id: row.id,
    participant,
    lastMessage: lastMsgRow ? mapMessageRow(lastMsgRow as MessageRow) : fallbackLastMessage,
    unreadCount: unreadCount ?? 0,
    updatedAt: row.updated_at,
    activeTradeId: row.active_trade_offer_id ?? undefined,
  };
}

export const messageService = {
  /** Mevcut kullanıcının katıldığı tüm konuşmaları, son mesaja göre sıralı döner. */
  async getConversations(currentUserId: string): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select(CONVERSATION_SELECT)
      .or(`participant_one_id.eq.${currentUserId},participant_two_id.eq.${currentUserId}`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Konuşmalar alınamadı:', error);
      return [];
    }

    return Promise.all((data ?? []).map((row) => mapConversationRow(row as ConversationRow, currentUserId)));
  },

  async getConversationById(id: string, currentUserId: string): Promise<Conversation | undefined> {
    const { data, error } = await supabase
      .from('conversations')
      .select(CONVERSATION_SELECT)
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      if (error) console.error('Konuşma alınamadı:', error);
      return undefined;
    }

    return mapConversationRow(data as ConversationRow, currentUserId);
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:profiles(*)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Mesajlar alınamadı:', error);
      return [];
    }

    return (data ?? []).map((row) => mapMessageRow(row as MessageRow));
  },

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    type: Message['type'] = 'text',
    tradeOfferId?: string
  ): Promise<Message | undefined> {
    const insertPayload: TablesInsert<'messages'> = {
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      type,
      trade_offer_id: tradeOfferId ?? null,
      is_read: false,
    };

    const { data, error } = await supabase
      .from('messages')
      .insert(insertPayload)
      .select('*, sender:profiles(*)')
      .single();

    if (error || !data) {
      console.error('Mesaj gönderilemedi:', error);
      return undefined;
    }

    return mapMessageRow(data as MessageRow);
  },

  /** Karşı tarafın mesajlarını "okundu" olarak işaretler. */
  async markConversationRead(conversationId: string, currentUserId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('is_read', false)
      .neq('sender_id', currentUserId);

    if (error) {
      console.error('Mesajlar okundu olarak işaretlenemedi:', error);
    }
  },

  /**
   * İki kullanıcı arasında var olan konuşmayı döner, yoksa yenisini açar.
   * `conversations_unique_pair_idx` sayesinde aynı çift için ikinci bir satır
   * asla oluşmaz (yarış durumunda DB unique constraint hatası fırlatır, bu
   * durumda mevcut satır tekrar okunur).
   */
  async getOrCreateConversationWithUser(
    currentUserId: string,
    targetUserId: string,
    relatedListingId?: string
  ): Promise<Conversation | undefined> {
    const { data: existingRows, error: findError } = await supabase
      .from('conversations')
      .select(CONVERSATION_SELECT)
      .or(
        `and(participant_one_id.eq.${currentUserId},participant_two_id.eq.${targetUserId}),and(participant_one_id.eq.${targetUserId},participant_two_id.eq.${currentUserId})`
      )
      .maybeSingle();

    if (findError) {
      console.error('Konuşma aranırken hata:', findError);
    }

    if (existingRows) {
      return mapConversationRow(existingRows as ConversationRow, currentUserId);
    }

    const insertPayload: TablesInsert<'conversations'> = {
      participant_one_id: currentUserId,
      participant_two_id: targetUserId,
      related_listing_id: relatedListingId ?? null,
    };

    const { data: created, error: insertError } = await supabase
      .from('conversations')
      .insert(insertPayload)
      .select(CONVERSATION_SELECT)
      .single();

    if (insertError || !created) {
      console.error('Konuşma oluşturulamadı:', insertError);
      // Yarış durumu: başka bir istek aynı anda aynı çifti oluşturmuş olabilir.
      // Unique constraint hatası aldıysak, satırı tekrar okumayı dene.
      const { data: retryRow } = await supabase
        .from('conversations')
        .select(CONVERSATION_SELECT)
        .or(
          `and(participant_one_id.eq.${currentUserId},participant_two_id.eq.${targetUserId}),and(participant_one_id.eq.${targetUserId},participant_two_id.eq.${currentUserId})`
        )
        .maybeSingle();

      return retryRow ? mapConversationRow(retryRow as ConversationRow, currentUserId) : undefined;
    }

    return mapConversationRow(created as ConversationRow, currentUserId);
  },
};

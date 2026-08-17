import { Conversation, Message } from '../types';
import { INITIAL_CONVERSATIONS, INITIAL_MESSAGES, CURRENT_USER, OTHER_USERS } from '../data/mockData';

let convsStore: Conversation[] = [...INITIAL_CONVERSATIONS];
const messagesMap: Record<string, Message[]> = { ...INITIAL_MESSAGES };

export const messageService = {
  getConversations(): Conversation[] {
    return [...convsStore];
  },

  getConversationById(id: string): Conversation | undefined {
    return convsStore.find((c) => c.id === id);
  },

  getMessages(conversationId: string): Message[] {
    return messagesMap[conversationId] || [];
  },

  sendMessage(conversationId: string, content: string, type: Message['type'] = 'text', tradeOfferId?: string): Message {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId: CURRENT_USER.id,
      senderName: CURRENT_USER.fullName,
      senderAvatar: CURRENT_USER.avatarUrl,
      content,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      type,
      tradeOfferId,
      isRead: true,
    };

    if (!messagesMap[conversationId]) {
      messagesMap[conversationId] = [];
    }
    messagesMap[conversationId].push(newMessage);

    const conv = convsStore.find((c) => c.id === conversationId);
    if (conv) {
      conv.lastMessage = newMessage;
      conv.updatedAt = new Date().toISOString();
    }

    return newMessage;
  },

  getOrCreateConversationWithUser(targetUserId: string, relatedListingId?: string): Conversation {
    let existing = convsStore.find((c) => c.participant.id === targetUserId);
    if (existing) return existing;

    const targetUser = OTHER_USERS[targetUserId] || {
      id: targetUserId,
      phone: '+90 5XX XXX XX XX',
      fullName: 'Swaloop Kullanıcısı',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      city: 'İstanbul',
      district: 'Kadıköy',
      memberSince: '2024',
      interests: [],
      wantedCategories: [],
      isVerified: true,
      trustProfile: {
        score: 4.8,
        level: 'Güvenilir',
        phoneVerified: true,
        idVerified: false,
        successfulTradesCount: 3,
        cancellationRate: 0,
        responseRate: 0.95,
        averageRating: 4.8,
        reviewCount: 4,
        reportCount: 0,
        accountAgeDays: 60,
        positiveHighlights: ['İyi iletişim'],
      },
      stats: {
        totalTrades: 3,
        activeListings: 1,
        completedLoops: 0,
        totalCo2Prevented: 18.4,
        totalWaterSaved: 400,
        totalEnergySaved: 180,
        totalRawMaterialsSaved: 2.2,
        totalItemsReused: 3,
        responseRatePercent: 95,
        avgResponseTimeMinutes: 15,
        cancellationRatePercent: 0,
      },
    };

    const newConv: Conversation = {
      id: `conv-${targetUserId}`,
      participant: targetUser,
      lastMessage: {
        id: `m-init-${Date.now()}`,
        conversationId: `conv-${targetUserId}`,
        senderId: 'system',
        senderName: 'Swaloop',
        senderAvatar: '',
        content: 'Sohbet başlatıldı. Güvenli takas için lütfen sistem üzerinden ilerleyiniz.',
        timestamp: 'Şimdi',
        type: 'system_card',
        isRead: true,
      },
      unreadCount: 0,
      updatedAt: new Date().toISOString(),
    };

    convsStore = [newConv, ...convsStore];
    messagesMap[newConv.id] = [newConv.lastMessage];
    return newConv;
  },
};

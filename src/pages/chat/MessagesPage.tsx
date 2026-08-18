import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { messageService } from '../../services/messageService';
import { Conversation, Message } from '../../types';
import {
  ArrowLeft,
  Send,
  ShieldCheck,
  MapPin,
  Calendar,
  Sparkles,
  ArrowLeftRight,
  Info,
  CheckCheck,
  Paperclip,
} from 'lucide-react';

export const MessagesPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { currentUser, showToast } = useApp();

  const [conversations, setConversations] = useState<Conversation[]>(() => messageService.getConversations());
  const [selectedConvId, setSelectedConvId] = useState<string | undefined>(id || (conversations[0]?.id));
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');

  const activeConv = conversations.find((c) => c.id === selectedConvId) || conversations[0];

  useEffect(() => {
    if (activeConv) {
      setMessages(messageService.getMessages(activeConv.id));
    }
  }, [selectedConvId, activeConv]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConv) return;

    const newMsg = messageService.sendMessage(activeConv.id, inputText.trim(), 'text');
    setMessages([...messages, newMsg]);
    setInputText('');
    setConversations(messageService.getConversations());
  };

  const sendQuickTemplate = (text: string) => {
    if (!activeConv) return;
    const newMsg = messageService.sendMessage(activeConv.id, text, 'text');
    setMessages([...messages, newMsg]);
    setConversations(messageService.getConversations());
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24 text-stone-900">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 pt-3">
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xs overflow-hidden flex flex-col md:flex-row min-h-[75vh]">
          {/* Left Sidebar: Conversations List */}
          <div
            className={`w-full md:w-80 border-r border-stone-200 bg-white flex flex-col ${
              selectedConvId && id ? 'hidden md:flex' : 'flex'
            }`}
          >
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <h1 className="text-base font-bold text-stone-900">Mesajlar</h1>
              <span className="text-xs text-stone-400 font-semibold">{conversations.length} sohbet</span>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-stone-100">
              {conversations.map((conv) => {
                const isSelected = conv.id === selectedConvId;
                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setSelectedConvId(conv.id);
                      navigate(`/mesajlar/${conv.id}`);
                    }}
                    className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-emerald-50/70 border-l-4 border-emerald-800' : 'hover:bg-stone-50'
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={conv.participant.avatarUrl}
                        alt={conv.participant.fullName}
                        className="w-12 h-12 rounded-full object-cover border border-stone-200"
                      />
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-700 ring-2 ring-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="text-xs font-bold text-stone-900 truncate">
                          {conv.participant.fullName}
                        </h4>
                        <span className="text-[10px] text-stone-400">{conv.lastMessage?.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-stone-500 truncate">
                        {conv.lastMessage?.content || 'Sohbete başlayın...'}
                      </p>
                      {conv.participant.trustProfile && (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-800 font-semibold mt-0.5">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Skor: {conv.participant.trustProfile.score.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Area: Active Chat Window */}
          {activeConv ? (
            <div
              className={`flex-1 flex flex-col bg-stone-50/50 ${
                !selectedConvId && !id ? 'hidden md:flex' : 'flex'
              }`}
            >
              {/* Chat Header */}
              <div className="p-3.5 bg-white border-b border-stone-200/90 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedConvId(undefined);
                      navigate('/mesajlar');
                    }}
                    className="md:hidden p-1.5 rounded-lg text-stone-600 hover:bg-stone-100"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <img
                    src={activeConv.participant.avatarUrl}
                    alt={activeConv.participant.fullName}
                    className="w-10 h-10 rounded-full object-cover border border-stone-200"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-bold text-stone-900">{activeConv.participant.fullName}</h3>
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded">
                        ★ {activeConv.participant.trustProfile?.score.toFixed(1) || '4.8'}
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-400">
                      {activeConv.participant.district}, {activeConv.participant.city} • Çevrimiçi
                    </span>
                  </div>
                </div>

                {/* Safe Point indicator */}
                <button
                  type="button"
                  onClick={() => navigate('/harita')}
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-900 text-[11px] font-bold border border-emerald-200"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Güvenli Takas Noktaları</span>
                </button>
              </div>

              {/* Safety notice ribbon */}
              <div className="bg-amber-50 px-3 py-1.5 border-b border-amber-200/60 text-[11px] text-amber-900 flex items-center justify-between">
                <span>🛡️ Swaloop Güvenliği: Kişisel IBAN, para transferi veya harici bağlantı paylaşmayınız.</span>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messages.map((msg) => {
                  const isMe = msg.senderId === currentUser.id;

                  if (msg.type === 'system_card') {
                    return (
                      <div key={msg.id} className="text-center my-2">
                        <span className="inline-block px-3 py-1 bg-stone-200/80 rounded-full text-[10px] font-semibold text-stone-600">
                          {msg.content}
                        </span>
                      </div>
                    );
                  }

                  if (msg.type === 'trade_card' && msg.tradeOfferId) {
                    // NOT: Önceden burada kullanılmayan bir `tradeService.getTradeById(...)`
                    // çağrısı vardı (senkron sürüm). Artık tradeService async olduğu için
                    // ve dönen değer zaten hiçbir yerde kullanılmıyordu, kaldırıldı. Kart
                    // sadece `msg.tradeOfferId` ile /teklif/:id sayfasına yönlendiriyor.
                    return (
                      <div
                        key={msg.id}
                        className={`max-w-xs sm:max-w-sm rounded-2xl p-3.5 border ${
                          isMe
                            ? 'ml-auto bg-emerald-900 text-white border-emerald-800'
                            : 'mr-auto bg-white text-stone-900 border-stone-200 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-bold mb-2">
                          <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
                          <span>Takas Teklifi İletildi</span>
                        </div>
                        <p className="text-xs mb-3">{msg.content}</p>
                        <button
                          type="button"
                          onClick={() => navigate(`/teklif/${msg.tradeOfferId}`)}
                          className="w-full py-2 bg-white text-emerald-950 font-bold rounded-xl text-xs hover:bg-emerald-50 transition-colors shadow-xs"
                        >
                          Takas Sürecini Görüntüle →
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[78%] sm:max-w-md px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-emerald-800 text-white rounded-tr-xs'
                            : 'bg-white text-stone-800 border border-stone-200/80 rounded-tl-xs shadow-xs'
                        }`}
                      >
                        <p>{msg.content}</p>
                      </div>
                      <span className="text-[9px] text-stone-400 mt-1 px-1">{msg.timestamp}</span>
                    </div>
                  );
                })}
              </div>

              {/* Quick Template Replies */}
              <div className="px-3 py-2 bg-white border-t border-stone-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => sendQuickTemplate('Merhaba, takas teklifiniz için teşekkürler! Detayları konuşalım.')}
                  className="px-2.5 py-1 rounded-full bg-stone-100 hover:bg-emerald-50 text-[11px] font-semibold text-stone-700 hover:text-emerald-800 whitespace-nowrap transition-colors"
                >
                  👋 Teklif İçin Teşekkürler
                </button>
                <button
                  type="button"
                  onClick={() => sendQuickTemplate('Kadıköy Güvenli Takas Noktasında (Metro Çıkışı) buluşabiliriz.')}
                  className="px-2.5 py-1 rounded-full bg-stone-100 hover:bg-emerald-50 text-[11px] font-semibold text-stone-700 hover:text-emerald-800 whitespace-nowrap transition-colors"
                >
                  📍 Güvenli Noktada Buluşalım
                </button>
                <button
                  type="button"
                  onClick={() => sendQuickTemplate('Ürün sıfır ayarında ve kutusuyla birlikte hazır.')}
                  className="px-2.5 py-1 rounded-full bg-stone-100 hover:bg-emerald-50 text-[11px] font-semibold text-stone-700 hover:text-emerald-800 whitespace-nowrap transition-colors"
                >
                  📦 Ürün Durumu Bilgisi
                </button>
              </div>

              {/* Message Input Form */}
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-stone-200/90 flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Mesajınızı yazın..."
                  className="flex-1 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs outline-hidden focus:bg-white focus:border-emerald-700 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="w-10 h-10 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-stone-400">
              <p className="text-xs">Sohbet seçiniz</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

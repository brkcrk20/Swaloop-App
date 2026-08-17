import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TradeOffer } from '../../types';
import { ArrowLeftRight, Check, X, Clock, Leaf, ShieldCheck, CornerUpRight } from 'lucide-react';
import { CircularExchangeIcon } from './SwaloopLogo';

interface TradeCardProps {
  trade: TradeOffer;
  isIncoming?: boolean;
  onAccept?: (tradeId: string) => void;
  onReject?: (tradeId: string) => void;
  onCounter?: (tradeId: string) => void;
  className?: string;
}

export const TradeCard: React.FC<TradeCardProps> = ({
  trade,
  isIncoming = false,
  onAccept,
  onReject,
  onCounter,
  className = '',
}) => {
  const navigate = useNavigate();

  const offeredItem = trade.offeredListings[0];
  const requestedItem = trade.requestedListings[0];
  const otherUser = isIncoming ? trade.initiator : trade.receiver;

  const getStatusBadge = (status: TradeOffer['status']) => {
    switch (status) {
      case 'offer_sent':
        return { label: 'Bekliyor', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'offer_received':
        return { label: 'Gelen Teklif', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'locked':
        return { label: 'Ürünler Kilitlendi', color: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'delivery_planned':
        return { label: 'Teslimat Planlandı', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
      case 'verified':
        return { label: 'Teslim Alındı', color: 'bg-teal-50 text-teal-800 border-teal-200' };
      case 'completed':
        return { label: 'Tamamlandı', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      case 'rejected':
        return { label: 'Reddedildi', color: 'bg-stone-100 text-stone-600 border-stone-200' };
      case 'counter_offered':
        return { label: 'Karşı Teklif Verildi', color: 'bg-purple-50 text-purple-800 border-purple-200' };
      default:
        return { label: status, color: 'bg-stone-100 text-stone-700 border-stone-200' };
    }
  };

  const statusInfo = getStatusBadge(trade.status);

  return (
    <div
      onClick={() => navigate(`/teklif/${trade.id}`)}
      className={`bg-white rounded-2xl border border-stone-200/90 p-4 hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer ${className}`}
    >
      {/* Header: User & Status */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2.5">
          <img
            src={otherUser.avatarUrl}
            alt={otherUser.fullName}
            className="w-9 h-9 rounded-full object-cover border border-stone-200"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-stone-900">{otherUser.fullName}</span>
              <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                {(otherUser.trustProfile?.score ?? 4.8).toFixed(1)}
              </span>
            </div>
            <span className="text-[11px] text-stone-400">
              {new Date(trade.createdAt).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        <span
          className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusInfo.color}`}
        >
          {statusInfo.label}
        </span>
      </div>

      {/* Side-by-Side Comparison Container */}
      <div className="grid grid-cols-2 gap-2.5 my-3 relative items-center">
        {/* Left Side: Senin Ürünün */}
        <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 flex flex-col items-center text-center">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">
            {isIncoming ? 'İstenen Ürünün' : 'Teklif Ettiğin Ürün'}
          </span>
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-stone-200 mb-1.5">
            <img
              src={
                isIncoming
                  ? requestedItem?.images[0] || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=200'
                  : offeredItem?.images[0] || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=200'
              }
              alt="Ürün 1"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-xs font-bold text-stone-800 line-clamp-1">
            {isIncoming ? requestedItem?.title : offeredItem?.title}
          </span>
          <span className="text-[10px] text-emerald-700 font-semibold mt-0.5">
            {isIncoming
              ? requestedItem?.estimatedImpact.co2eKg
              : offeredItem?.estimatedImpact.co2eKg}{' '}
            kg CO₂e
          </span>
        </div>

        {/* Center Exchange Icon badge */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white border border-stone-200 shadow-xs flex items-center justify-center">
          <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-700" />
        </div>

        {/* Right Side: Karşı Tarafın Ürünü */}
        <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 flex flex-col items-center text-center">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">
            {isIncoming ? 'Teklif Edilen Ürün' : 'İstediğin Ürün'}
          </span>
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-stone-200 mb-1.5">
            <img
              src={
                isIncoming
                  ? offeredItem?.images[0] || 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=200'
                  : requestedItem?.images[0] || 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=200'
              }
              alt="Ürün 2"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-xs font-bold text-stone-800 line-clamp-1">
            {isIncoming ? offeredItem?.title : requestedItem?.title}
          </span>
          <span className="text-[10px] text-emerald-700 font-semibold mt-0.5">
            {isIncoming
              ? offeredItem?.estimatedImpact.co2eKg
              : requestedItem?.estimatedImpact.co2eKg}{' '}
            kg CO₂e
          </span>
        </div>
      </div>

      {/* Note preview if any */}
      {trade.note && (
        <div className="p-2 rounded-xl bg-stone-50 text-xs text-stone-600 italic mb-3 line-clamp-1">
          "{trade.note}"
        </div>
      )}

      {/* Combined SVS impact benefit badge */}
      <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs text-stone-500">
        <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
          <Leaf className="w-3.5 h-3.5 text-emerald-600" />
          <span>Toplam +{trade.combinedImpact.co2eKg} kg CO₂e</span>
        </div>

        {/* Quick action buttons if incoming and waiting */}
        {isIncoming && trade.status === 'offer_received' && onAccept && onReject ? (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => onReject(trade.id)}
              className="px-2.5 py-1 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-100 text-xs font-semibold transition-colors cursor-pointer"
            >
              Reddet
            </button>
            <button
              type="button"
              onClick={() => onAccept(trade.id)}
              className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Kabul Et
            </button>
          </div>
        ) : (
          <span className="text-[11px] font-semibold text-emerald-700">Detayları Gör →</span>
        )}
      </div>
    </div>
  );
};

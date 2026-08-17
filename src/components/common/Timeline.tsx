import React from 'react';
import { TradeEvent, TradeStatus } from '../../types';
import { Check, Clock, AlertCircle, Lock, Truck, ShieldCheck, Award } from 'lucide-react';

interface TimelineProps {
  timeline: TradeEvent[];
  currentStatus: TradeStatus;
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({
  timeline,
  currentStatus,
  className = '',
}) => {
  const stepsMeta = [
    { step: 1, label: 'Teklif', icon: Clock },
    { step: 2, label: 'Kabul', icon: Check },
    { step: 3, label: 'Kilitlendi', icon: Lock },
    { step: 4, label: 'Teslimat', icon: Truck },
    { step: 5, label: 'Onay', icon: ShieldCheck },
    { step: 6, label: 'Tamamlandı', icon: Award },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Horizontal step indicator bar */}
      <div className="relative flex items-center justify-between px-2 py-4">
        {/* Background connector line */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-stone-200 -z-0" />

        {stepsMeta.map((s, idx) => {
          const eventItem = timeline.find((e) => e.step === s.step);
          const isCompleted = eventItem?.status === 'completed';
          const isInProgress = eventItem?.status === 'in_progress';
          const isFailed = eventItem?.status === 'failed';

          let circleStyle = 'bg-stone-100 border-stone-300 text-stone-400';
          if (isCompleted) {
            circleStyle = 'bg-emerald-700 border-emerald-700 text-white shadow-xs';
          } else if (isInProgress) {
            circleStyle = 'bg-amber-500 border-amber-500 text-white animate-pulse';
          } else if (isFailed) {
            circleStyle = 'bg-rose-500 border-rose-500 text-white';
          }

          return (
            <div key={s.step} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-colors ${circleStyle}`}
              >
                {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : s.step}
              </div>
              <span
                className={`text-[10px] font-semibold mt-1.5 ${
                  isCompleted
                    ? 'text-emerald-900 font-bold'
                    : isInProgress
                    ? 'text-amber-700 font-bold'
                    : 'text-stone-400'
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Detailed vertical log list */}
      <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
          Takas Süreç Günlüğü
        </h4>
        <div className="space-y-3">
          {timeline.map((evt, idx) => {
            const isCompleted = evt.status === 'completed';
            const isInProgress = evt.status === 'in_progress';
            const isFailed = evt.status === 'failed';

            return (
              <div key={evt.id || idx} className="flex items-start gap-3 text-xs">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                    isCompleted
                      ? 'bg-emerald-100 text-emerald-800'
                      : isInProgress
                      ? 'bg-amber-100 text-amber-800'
                      : isFailed
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-stone-200 text-stone-500'
                  }`}
                >
                  {isCompleted ? '✓' : evt.step}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900">{evt.title}</span>
                    <span className="text-[10px] text-stone-400">{evt.timestamp}</span>
                  </div>
                  <p className="text-stone-600 mt-0.5">{evt.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

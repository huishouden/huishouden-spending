import React from 'react';
import { CreditCard, Sparkles } from 'lucide-react';

interface CardBadgeProps {
  cardName: string;
  cardType?: 'chase' | 'robinhood' | 'other';
  showCashback?: boolean;
  size?: 'sm' | 'md' | 'lg';
  isLight?: boolean;
}

export const CardBadge: React.FC<CardBadgeProps> = ({
  cardName,
  cardType,
  showCashback = false,
  size = 'md',
  isLight = true,
}) => {
  // Styled by issuer only; the label is always the card's own name from the sheet.
  const isRobinhood = cardType === 'robinhood' || cardName.toLowerCase().includes('robinhood');
  const isChase = cardType === 'chase' || cardName.toLowerCase().includes('chase');

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs'
      : size === 'lg'
      ? 'px-3 py-1.5 text-sm'
      : 'px-2.5 py-1 text-xs';

  if (isRobinhood) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-lg border transition-all ${sizeClasses} ${
          isLight
            ? 'bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-100/60 border-amber-300/80 text-amber-900 shadow-xs'
            : 'bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-600/25 border-amber-500/40 text-amber-300 shadow-xs'
        }`}
      >
        <Sparkles className={size === 'sm' ? 'w-3 h-3 text-amber-600 dark:text-amber-400' : 'w-3.5 h-3.5 text-amber-600 dark:text-amber-400'} />
        <span className="font-semibold tracking-wide">{cardName}</span>
        {showCashback && (
          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${
            isLight
              ? 'bg-amber-200/60 text-amber-950 border-amber-300'
              : 'bg-amber-400/20 text-amber-200 border-amber-400/30'
          }`}>
            Rewards
          </span>
        )}
      </span>
    );
  }

  if (isChase) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-lg border transition-all ${sizeClasses} ${
          isLight
            ? 'bg-sky-50 border-sky-200 text-sky-950 shadow-xs'
            : 'bg-blue-950/40 border-blue-600/30 text-blue-300 shadow-xs'
        }`}
      >
        <CreditCard className={size === 'sm' ? 'w-3 h-3 text-sky-600 dark:text-blue-400' : 'w-3.5 h-3.5 text-sky-600 dark:text-blue-400'} />
        <span className="font-semibold">{cardName || 'Chase Card'}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-lg border transition-all ${sizeClasses} ${
        isLight
          ? 'bg-slate-100 border-slate-200 text-slate-800 shadow-xs'
          : 'bg-slate-800/80 border-slate-700 text-slate-300 shadow-xs'
      }`}
    >
      <CreditCard className={size === 'sm' ? 'w-3 h-3 text-slate-500 dark:text-slate-400' : 'w-3.5 h-3.5 text-slate-500 dark:text-slate-400'} />
      <span className="font-medium">{cardName}</span>
    </span>
  );
};

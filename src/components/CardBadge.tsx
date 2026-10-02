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
        className={`inline-flex items-center gap-1.5 font-medium rounded-full border transition-all ${sizeClasses} ${
          isLight
            ? 'bg-forest-50 border-forest-100 text-forest-700'
            : 'bg-forest-700 border-forest-600 text-forest-100'
        }`}
      >
        <Sparkles className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span className="font-medium">{cardName}</span>
        {showCashback && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
            isLight
              ? 'bg-white text-forest-700 border-forest-200'
              : 'bg-forest-800 text-forest-100 border-forest-600'
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
        className={`inline-flex items-center gap-1.5 font-medium rounded-full border transition-all ${sizeClasses} ${
          isLight
            ? 'bg-stone-100 border-stone-200 text-stone-700'
            : 'bg-forest-900/60 border-forest-600 text-stone-200'
        }`}
      >
        <CreditCard className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span className="font-medium">{cardName || 'Chase Card'}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border transition-all ${sizeClasses} ${
        isLight
          ? 'bg-stone-100 border-stone-200 text-stone-700'
          : 'bg-forest-900/60 border-forest-600 text-stone-200'
      }`}
    >
      <CreditCard className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span className="font-medium">{cardName}</span>
    </span>
  );
};

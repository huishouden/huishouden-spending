import React from 'react';
import { CardSummary } from '../types';
import { CardBadge } from './CardBadge';
import { Sparkles, Coins, ArrowRight } from 'lucide-react';

interface CardBreakdownProps {
  cards: CardSummary[];
  currencySymbol: string;
  selectedCard: string | null;
  onSelectCard: (cardName: string | null) => void;
  theme?: 'light' | 'dark';
}

export const CardBreakdown: React.FC<CardBreakdownProps> = ({
  cards,
  currencySymbol,
  selectedCard,
  onSelectCard,
  theme = 'light',
}) => {
  const isLight = theme === 'light';
  const totalCashback = cards.reduce((sum, c) => sum + (c.cashbackEstimate || 0), 0);

  return (
    <div
      className={`rounded-2xl p-5 sm:p-6 transition-all border ${
        isLight
          ? 'bg-white border-stone-200/80 shadow-sm shadow-stone-900/5'
          : 'bg-forest-800 border-forest-700/60'
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h3 className={`text-base font-semibold tracking-tight ${isLight ? 'text-forest-700' : 'text-cream'}`}>
            Active Household Cards
          </h3>
          <p className={`text-xs ${isLight ? 'text-stone-600' : 'text-stone-300'}`}>
            Card charges only (debits & mortgage excluded)
          </p>
        </div>

        {totalCashback > 0 && (
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium shrink-0 ${
              isLight
                ? 'bg-forest-50 text-forest-700'
                : 'bg-forest-700 text-forest-100'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>~{currencySymbol}{Math.round(totalCashback)} rewards earned</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {cards.map((card) => {
          const isSelected = selectedCard === card.cardName;

          return (
            <div
              key={card.cardName}
              onClick={() => onSelectCard(isSelected ? null : card.cardName)}
              className={`relative overflow-hidden rounded-xl p-4 sm:p-5 border transition-all cursor-pointer ${
                isSelected
                  ? isLight
                    ? 'border-forest-600 ring-2 ring-forest-600/20 bg-forest-50/60'
                    : 'border-forest-400 ring-2 ring-forest-400/30 bg-forest-700'
                  : isLight
                  ? 'bg-stone-50 border-stone-200/70 hover:border-forest-300'
                  : 'bg-forest-900/50 border-forest-700/60 hover:border-forest-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <CardBadge cardName={card.cardName} cardType={card.cardType} size="md" isLight={isLight} />
                  <div className={`text-2xl font-bold mt-3 tracking-tight tabular-nums ${isLight ? 'text-forest-700' : 'text-cream'}`}>
                    {currencySymbol}
                    {card.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className={`text-xs mt-1 ${isLight ? 'text-stone-600' : 'text-stone-300'}`}>
                    {card.transactionCount} transactions · {Math.round(card.percentage)}% of household card spend
                  </div>
                </div>

                <div className="text-right">
                  {card.cashbackEstimate && (
                    <div
                      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
                        isLight
                          ? 'bg-forest-50 text-forest-700'
                          : 'bg-forest-700 text-forest-100'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      +{currencySymbol}{card.cashbackEstimate.toFixed(0)} est.
                    </div>
                  )}
                  <div
                    className={`mt-4 flex items-center justify-end text-xs gap-1 transition ${
                      isLight ? 'text-stone-600 hover:text-forest-700' : 'text-stone-300 hover:text-white'
                    }`}
                  >
                    <span>{isSelected ? 'Active Filter' : 'Filter Card'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>

              {/* Share bar */}
              <div
                className={`mt-4 w-full rounded-full h-1.5 overflow-hidden ${
                  isLight ? 'bg-stone-200/70' : 'bg-forest-800'
                }`}
              >
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isLight ? 'bg-forest-600' : 'bg-forest-400'
                  }`}
                  style={{ width: `${Math.min(100, card.percentage)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {selectedCard && (
        <div className="mt-3 text-right">
          <button
            onClick={() => onSelectCard(null)}
            className="text-xs text-forest-700 dark:text-forest-300 hover:underline cursor-pointer font-medium"
          >
            Clear card filter (show all cards)
          </button>
        </div>
      )}
    </div>
  );
};

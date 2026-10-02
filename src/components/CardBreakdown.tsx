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
      className={`rounded-2xl p-5 transition-all border ${
        isLight
          ? 'bg-white border-slate-200/90 shadow-sm'
          : 'bg-slate-900/90 backdrop-blur-md border-slate-800/80 shadow-lg shadow-black/20'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`text-base font-semibold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Active Household Cards
          </h3>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Card charges only (debits & mortgage excluded)
          </p>
        </div>

        {totalCashback > 0 && (
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              isLight
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>~{currencySymbol}{Math.round(totalCashback)} rewards earned</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {cards.map((card) => {
          const isSelected = selectedCard === card.cardName;
          const isRobinhood = card.cardType === 'robinhood';

          return (
            <div
              key={card.cardName}
              onClick={() => onSelectCard(isSelected ? null : card.cardName)}
              className={`relative overflow-hidden rounded-xl p-4 border transition-all cursor-pointer ${
                isSelected
                  ? isLight
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20 shadow-md'
                    : 'border-indigo-500 ring-2 ring-indigo-500/30 bg-slate-800/90'
                  : isLight
                  ? isRobinhood
                    ? 'bg-gradient-to-br from-amber-50/80 via-yellow-50/40 to-white border-amber-200/90 hover:border-amber-300 shadow-xs'
                    : 'bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-white border-blue-200/90 hover:border-blue-300 shadow-xs'
                  : isRobinhood
                  ? 'bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900 border-amber-500/30 hover:border-amber-500/50'
                  : 'bg-gradient-to-br from-slate-900 via-blue-950/20 to-slate-900 border-blue-500/30 hover:border-blue-500/50'
              }`}
            >
              {/* Top Accent Stripe */}
              <div
                className={`absolute top-0 left-0 right-0 h-1.5 ${
                  isRobinhood
                    ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500'
                    : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600'
                }`}
              />

              <div className="flex items-start justify-between">
                <div>
                  <CardBadge cardName={card.cardName} cardType={card.cardType} size="md" isLight={isLight} />
                  <div className={`text-2xl font-bold mt-2.5 tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {currencySymbol}
                    {card.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {card.transactionCount} transactions · {Math.round(card.percentage)}% of household card spend
                  </div>
                </div>

                <div className="text-right">
                  {card.cashbackEstimate && (
                    <div
                      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                        isLight
                          ? 'bg-amber-100/70 text-amber-950 border-amber-200'
                          : 'bg-amber-400/10 text-amber-300 border-amber-400/20'
                      }`}
                    >
                      <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      +{currencySymbol}{card.cashbackEstimate.toFixed(0)} est.
                    </div>
                  )}
                  <div
                    className={`mt-4 flex items-center justify-end text-xs gap-1 transition ${
                      isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{isSelected ? 'Active Filter' : 'Filter Card'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>

              {/* Share bar */}
              <div
                className={`mt-3 w-full rounded-full h-1.5 overflow-hidden ${
                  isLight ? 'bg-slate-100 border border-slate-200/50' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isRobinhood ? 'bg-amber-500' : 'bg-blue-600'
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
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-medium"
          >
            Clear card filter (show all cards)
          </button>
        </div>
      )}
    </div>
  );
};

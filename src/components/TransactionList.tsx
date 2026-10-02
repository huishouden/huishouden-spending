import React, { useState } from 'react';
import { CardTransaction } from '../types';
import { CardBadge } from './CardBadge';
import { CategoryIcon } from './CategoryIcon';
import { CATEGORY_COLORS } from '../services/mockData';
import { Search, ArrowUpDown, Filter, X } from 'lucide-react';

interface TransactionListProps {
  transactions: CardTransaction[];
  currencySymbol: string;
  selectedCard: string | null;
  selectedCategory: string | null;
  onClearCardFilter: () => void;
  onClearCategoryFilter: () => void;
  theme?: 'light' | 'dark';
  /** Opens a transaction to change its category or remove it. */
  onSelect?: (transaction: CardTransaction) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  currencySymbol,
  selectedCard,
  selectedCategory,
  onClearCardFilter,
  onClearCategoryFilter,
  theme = 'light',
  onSelect,
}) => {
  const isLight = theme === 'light';
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const filtered = transactions.filter((t) => {
    if (selectedCard && t.cardName !== selectedCard) return false;
    if (selectedCategory && t.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchMerchant = t.merchant.toLowerCase().includes(q);
      const matchNotes = (t.notes || '').toLowerCase().includes(q);
      const matchCat = t.category.toLowerCase().includes(q);
      const matchCard = t.cardName.toLowerCase().includes(q);
      return matchMerchant || matchNotes || matchCat || matchCard;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'amount') {
      return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
    }
    return sortOrder === 'desc' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date);
  });

  const toggleSort = (type: 'date' | 'amount') => {
    if (sortBy === type) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(type);
      setSortOrder('desc');
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      className={`rounded-2xl p-5 sm:p-6 transition-all border ${
        isLight
          ? 'bg-white border-stone-200/80 shadow-sm shadow-stone-900/5'
          : 'bg-forest-800 border-forest-700/60'
      }`}
    >
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className={`text-base font-semibold tracking-tight ${isLight ? 'text-forest-700' : 'text-cream'}`}>
              Recent Card Charges
            </h3>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium tabular-nums whitespace-nowrap ${
                isLight ? 'bg-stone-100 text-stone-600' : 'bg-forest-900/60 text-stone-300'
              }`}
            >
              {filtered.length} charges
            </span>
          </div>
          <p className={`text-xs ${isLight ? 'text-stone-600' : 'text-stone-300'}`}>
            Household credit card spending feed
          </p>
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-stone-500' : 'text-stone-400'}`} />
            <input
              type="text"
              placeholder="Search merchant, card..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`border rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-forest-200 focus:border-forest-500 w-48 sm:w-56 transition ${
                isLight
                  ? 'bg-white border-stone-200 text-stone-800 placeholder-stone-500'
                  : 'bg-forest-900/60 border-forest-700 text-stone-100 placeholder-stone-400'
              }`}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${isLight ? 'text-stone-500 hover:text-stone-700' : 'text-stone-300 hover:text-white'}`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            onClick={() => toggleSort('date')}
            className={`flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-xl border transition cursor-pointer ${
              sortBy === 'date'
                ? isLight
                  ? 'bg-forest-700 text-white border-forest-700'
                  : 'bg-forest-300 text-forest-900 border-forest-300'
                : isLight
                ? 'bg-white text-stone-700 border-stone-200 hover:border-forest-400'
                : 'bg-forest-900/50 text-stone-200 border-forest-700 hover:border-forest-500'
            }`}
          >
            <ArrowUpDown className="w-3 h-3" />
            <span>Date {sortBy === 'date' && (sortOrder === 'desc' ? '↓' : '↑')}</span>
          </button>

          <button
            onClick={() => toggleSort('amount')}
            className={`flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-xl border transition cursor-pointer ${
              sortBy === 'amount'
                ? isLight
                  ? 'bg-forest-700 text-white border-forest-700'
                  : 'bg-forest-300 text-forest-900 border-forest-300'
                : isLight
                ? 'bg-white text-stone-700 border-stone-200 hover:border-forest-400'
                : 'bg-forest-900/50 text-stone-200 border-forest-700 hover:border-forest-500'
            }`}
          >
            <ArrowUpDown className="w-3 h-3" />
            <span>Amount {sortBy === 'amount' && (sortOrder === 'desc' ? '↓' : '↑')}</span>
          </button>
        </div>
      </div>

      {/* Active filters pill banner */}
      {(selectedCard || selectedCategory) && (
        <div
          className={`flex items-center gap-2 mb-3 p-2 rounded-xl text-xs border ${
            isLight
              ? 'bg-forest-50 border-forest-100 text-forest-900'
              : 'bg-forest-900/50 border-forest-700 text-forest-100'
          }`}
        >
          <Filter className="w-3.5 h-3.5 shrink-0 text-forest-600 dark:text-forest-300" />
          <span className={isLight ? 'text-stone-600' : 'text-stone-300'}>Filtering:</span>
          {selectedCard && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${
                isLight ? 'bg-white border border-forest-200 text-stone-800' : 'bg-forest-700 text-white'
              }`}
            >
              {selectedCard}
              <button onClick={onClearCardFilter} className="hover:text-terracotta-dark dark:hover:text-terracotta-light">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedCategory && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${
                isLight ? 'bg-white border border-forest-200 text-stone-800' : 'bg-forest-700 text-white'
              }`}
            >
              {selectedCategory}
              <button onClick={onClearCategoryFilter} className="hover:text-terracotta-dark dark:hover:text-terracotta-light">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Transactions Table/List */}
      <div
        className={`overflow-hidden rounded-xl border ${
          isLight ? 'border-stone-200/70' : 'border-forest-700/60'
        }`}
      >
        <div
          className={`divide-y max-h-[380px] overflow-y-auto ${
            isLight ? 'divide-stone-100' : 'divide-forest-700/50'
          }`}
        >
          {sorted.map((t) => {
            const colorMeta = CATEGORY_COLORS[t.category] || {
              bg: 'bg-stone-100 text-stone-800 border-stone-200',
              darkBg: 'bg-stone-500/15 text-stone-300 border-stone-500/20',
            };

            const iconClass = isLight ? colorMeta.bg : colorMeta.darkBg;

            return (
              <div
                key={t.id}
                {...(onSelect
                  ? {
                      role: 'button',
                      tabIndex: 0,
                      'aria-label': `${t.merchant}, ${t.date}`,
                      onClick: () => onSelect(t),
                      onKeyDown: (e: React.KeyboardEvent) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelect(t);
                        }
                      },
                    }
                  : {})}
                className={`p-3.5 sm:px-5 sm:py-4 flex items-center justify-between transition-colors ${onSelect ? 'cursor-pointer' : ''} ${
                  isLight ? 'hover:bg-stone-50' : 'hover:bg-forest-900/40'
                }`}
              >
                {/* Left: Merchant & details */}
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  <div
                    className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center ${iconClass}`}
                  >
                    <CategoryIcon name={t.category} className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm font-medium truncate max-w-[200px] sm:max-w-[320px] ${
                          isLight ? 'text-stone-800' : 'text-cream'
                        }`}
                      >
                        {t.merchant}
                      </span>
                      <CardBadge cardName={t.cardName} cardType={t.cardType} size="sm" isLight={isLight} />
                    </div>

                    <div
                      className={`flex items-center gap-2 text-xs mt-1 ${
                        isLight ? 'text-stone-500' : 'text-stone-300'
                      }`}
                    >
                      <span>{formatDate(t.date)}</span>
                      <span>•</span>
                      <span className={isLight ? 'text-stone-600' : 'text-stone-200'}>
                        {t.category}
                      </span>
                      {t.notes && (
                        <>
                          <span>•</span>
                          <span
                            className={`italic truncate max-w-[180px] hidden sm:inline ${
                              isLight ? 'text-stone-500' : 'text-stone-300'
                            }`}
                          >
                            {t.notes}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount */}
                <div className="text-right shrink-0">
                  <div
                    className={`text-base font-semibold tracking-tight tabular-nums ${
                      isLight ? 'text-stone-800' : 'text-cream'
                    }`}
                  >
                    {currencySymbol}
                    {t.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            );
          })}

          {sorted.length === 0 && (
            <div className={`py-12 text-center text-sm ${isLight ? 'text-stone-500' : 'text-stone-400'}`}>
              No matching card transactions found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  currencySymbol,
  selectedCard,
  selectedCategory,
  onClearCardFilter,
  onClearCategoryFilter,
  theme = 'light',
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
      className={`rounded-2xl p-5 transition-all border ${
        isLight
          ? 'bg-white border-slate-200/90 shadow-sm'
          : 'bg-slate-900/90 backdrop-blur-md border-slate-800/80 shadow-lg shadow-black/20'
      }`}
    >
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className={`text-base font-semibold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Recent Card Charges
            </h3>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {filtered.length} charges
            </span>
          </div>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Household credit card spending feed
          </p>
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-slate-400'}`} />
            <input
              type="text"
              placeholder="Search merchant, card..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`border rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-48 sm:w-56 transition ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white'
                  : 'bg-slate-800/80 border-slate-700/80 text-slate-200 placeholder-slate-500'
              }`}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-400 hover:text-white'}`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            onClick={() => toggleSort('date')}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-xl border transition cursor-pointer ${
              sortBy === 'date'
                ? isLight
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-300 font-semibold'
                  : 'bg-slate-800 text-indigo-400 border-indigo-500/40'
                : isLight
                ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <ArrowUpDown className="w-3 h-3" />
            <span>Date {sortBy === 'date' && (sortOrder === 'desc' ? '↓' : '↑')}</span>
          </button>

          <button
            onClick={() => toggleSort('amount')}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-xl border transition cursor-pointer ${
              sortBy === 'amount'
                ? isLight
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-300 font-semibold'
                  : 'bg-slate-800 text-indigo-400 border-indigo-500/40'
                : isLight
                ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:text-slate-200'
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
              ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
              : 'bg-indigo-950/30 border-indigo-500/20 text-indigo-200'
          }`}
        >
          <Filter className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
          <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Filtering:</span>
          {selectedCard && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${
                isLight ? 'bg-white border border-indigo-200 text-slate-800' : 'bg-slate-800 text-white'
              }`}
            >
              {selectedCard}
              <button onClick={onClearCardFilter} className="hover:text-rose-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedCategory && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${
                isLight ? 'bg-white border border-indigo-200 text-slate-800' : 'bg-slate-800 text-white'
              }`}
            >
              {selectedCategory}
              <button onClick={onClearCategoryFilter} className="hover:text-rose-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Transactions Table/List */}
      <div
        className={`overflow-hidden rounded-xl border ${
          isLight ? 'border-slate-200/90' : 'border-slate-800/70'
        }`}
      >
        <div
          className={`divide-y max-h-[380px] overflow-y-auto ${
            isLight ? 'divide-slate-100' : 'divide-slate-800/60'
          }`}
        >
          {sorted.map((t) => {
            const colorMeta = CATEGORY_COLORS[t.category] || {
              bg: 'bg-slate-100 text-slate-800 border-slate-200',
              darkBg: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
            };

            const iconClass = isLight ? colorMeta.bg : colorMeta.darkBg;

            return (
              <div
                key={t.id}
                className={`p-3.5 sm:px-4 flex items-center justify-between transition-colors ${
                  isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'
                }`}
              >
                {/* Left: Merchant & details */}
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  <div
                    className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center border ${iconClass}`}
                  >
                    <CategoryIcon name={t.category} className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm font-semibold truncate max-w-[200px] sm:max-w-[320px] ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}
                      >
                        {t.merchant}
                      </span>
                      <CardBadge cardName={t.cardName} cardType={t.cardType} size="sm" isLight={isLight} />
                    </div>

                    <div
                      className={`flex items-center gap-2 text-xs mt-0.5 ${
                        isLight ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      <span>{formatDate(t.date)}</span>
                      <span>•</span>
                      <span className={isLight ? 'text-slate-700 font-medium' : 'text-slate-300 font-medium'}>
                        {t.category}
                      </span>
                      {t.notes && (
                        <>
                          <span>•</span>
                          <span
                            className={`italic truncate max-w-[180px] hidden sm:inline ${
                              isLight ? 'text-slate-400' : 'text-slate-400'
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
                    className={`text-base font-bold tracking-tight ${
                      isLight ? 'text-slate-900' : 'text-white'
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
            <div className={`py-12 text-center text-sm ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
              No matching card transactions found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

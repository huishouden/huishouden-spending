import React from 'react';
import { CategorySummary } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { CATEGORY_COLORS } from '../services/mockData';
import { Layers } from 'lucide-react';

interface CategoryListProps {
  categories: CategorySummary[];
  currencySymbol: string;
  selectedCategory: string | null;
  onSelectCategory: (cat: string | null) => void;
  maxDisplay?: number;
  theme?: 'light' | 'dark';
}

export const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  currencySymbol,
  selectedCategory,
  onSelectCategory,
  maxDisplay,
  theme = 'light',
}) => {
  const isLight = theme === 'light';
  const displayed = maxDisplay ? categories.slice(0, maxDisplay) : categories;

  return (
    <div
      className={`rounded-2xl p-5 transition-all border ${
        isLight
          ? 'bg-white border-slate-200/90 shadow-sm'
          : 'bg-slate-900/90 backdrop-blur-md border-slate-800/80 shadow-lg shadow-black/20'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isLight
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-600'
                : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
            }`}
          >
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className={`text-base font-semibold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Spending by Category
            </h3>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Tap any category to filter card transactions
            </p>
          </div>
        </div>

        {selectedCategory && (
          <button
            onClick={() => onSelectCategory(null)}
            className={`text-xs px-2.5 py-1 rounded-lg border transition cursor-pointer ${
              isLight
                ? 'text-indigo-600 hover:text-indigo-700 bg-indigo-50 border-indigo-200'
                : 'text-indigo-400 hover:text-indigo-300 bg-slate-800 border-slate-700'
            }`}
          >
            Show All
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        {displayed.map((cat) => {
          const isSelected = selectedCategory === cat.category;
          const colorMeta = CATEGORY_COLORS[cat.category] || {
            bg: 'bg-slate-100 text-slate-800 border-slate-200',
            darkBg: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
            text: 'text-slate-700',
            darkText: 'text-slate-400',
            bar: 'bg-slate-500',
          };

          const iconClass = isLight ? colorMeta.bg : colorMeta.darkBg;

          return (
            <div
              key={cat.category}
              onClick={() => onSelectCategory(isSelected ? null : cat.category)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? isLight
                    ? 'border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-500/20 shadow-xs'
                    : 'border-indigo-500 bg-slate-800/90 ring-1 ring-indigo-500/30'
                  : isLight
                  ? 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/80 hover:border-slate-300 shadow-2xs'
                  : 'bg-slate-800/30 border-slate-800/60 hover:bg-slate-800/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center border ${iconClass}`}
                  >
                    <CategoryIcon name={cat.category} className="w-4 h-4" />
                  </div>
                  <div>
                    <div className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                      {cat.category}
                    </div>
                    <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {cat.transactionCount} charges · {cat.percentage.toFixed(1)}% of card spend
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-base font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {currencySymbol}
                    {cat.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div
                className={`mt-2.5 w-full rounded-full h-1.5 overflow-hidden ${
                  isLight ? 'bg-slate-100 border border-slate-200/50' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`h-full rounded-full transition-all duration-500 ${colorMeta.bar}`}
                  style={{ width: `${Math.min(100, Math.max(3, cat.percentage))}%` }}
                />
              </div>
            </div>
          );
        })}

        {categories.length === 0 && (
          <div className={`text-center py-6 text-sm ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            No category spend recorded for this month.
          </div>
        )}
      </div>
    </div>
  );
};

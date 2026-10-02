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
      className={`rounded-2xl p-5 sm:p-6 transition-all border ${
        isLight
          ? 'bg-white border-stone-200/80 shadow-sm shadow-stone-900/5'
          : 'bg-forest-800 border-forest-700/60'
      }`}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isLight
                ? 'bg-forest-50 text-forest-700'
                : 'bg-forest-700 text-forest-100'
            }`}
          >
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className={`text-base font-semibold tracking-tight ${isLight ? 'text-forest-700' : 'text-cream'}`}>
              Spending by Category
            </h3>
            <p className={`text-xs ${isLight ? 'text-stone-600' : 'text-stone-300'}`}>
              Tap any category to filter card transactions
            </p>
          </div>
        </div>

        {selectedCategory && (
          <button
            onClick={() => onSelectCategory(null)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition cursor-pointer ${
              isLight
                ? 'text-forest-700 bg-white hover:bg-forest-50 border-stone-200'
                : 'text-forest-100 bg-forest-900/50 hover:bg-forest-700 border-forest-700'
            }`}
          >
            Show All
          </button>
        )}
      </div>

      <div className="space-y-2">
        {displayed.map((cat) => {
          const isSelected = selectedCategory === cat.category;
          const colorMeta = CATEGORY_COLORS[cat.category] || {
            bg: 'bg-stone-100 text-stone-800 border-stone-200',
            darkBg: 'bg-stone-500/15 text-stone-400 border-stone-500/20',
            text: 'text-stone-700',
            darkText: 'text-stone-400',
            bar: 'bg-cat-stone',
          };

          const iconClass = isLight ? colorMeta.bg : colorMeta.darkBg;

          return (
            <div
              key={cat.category}
              onClick={() => onSelectCategory(isSelected ? null : cat.category)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? isLight
                    ? 'border-forest-600 bg-forest-50/60 ring-1 ring-forest-600/20'
                    : 'border-forest-400 bg-forest-700 ring-1 ring-forest-400/30'
                  : isLight
                  ? 'bg-white border-stone-200/70 hover:bg-stone-50 hover:border-stone-300'
                  : 'bg-forest-900/40 border-forest-700/50 hover:bg-forest-900/70 hover:border-forest-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconClass}`}
                  >
                    <CategoryIcon name={cat.category} className="w-4 h-4" />
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${isLight ? 'text-stone-800' : 'text-stone-100'}`}>
                      {cat.category}
                    </div>
                    <div className={`text-xs ${isLight ? 'text-stone-500' : 'text-stone-300'}`}>
                      {cat.transactionCount} charges · {cat.percentage.toFixed(1)}% of card spend
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-base font-semibold tracking-tight tabular-nums ${isLight ? 'text-stone-800' : 'text-cream'}`}>
                    {currencySymbol}
                    {cat.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div
                className={`mt-3 w-full rounded-full h-1.5 overflow-hidden ${
                  isLight ? 'bg-stone-100' : 'bg-forest-900/70'
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
          <div className={`text-center py-6 text-sm ${isLight ? 'text-stone-500' : 'text-stone-400'}`}>
            No category spend recorded for this month.
          </div>
        )}
      </div>
    </div>
  );
};

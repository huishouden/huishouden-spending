import React from 'react';
import { Target, TrendingDown, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { HouseholdSettings } from '../types';

interface BudgetPacingCardProps {
  totalSpend: number;
  monthKey: string;
  settings: HouseholdSettings;
  onEditBudget: () => void;
  isAmbient?: boolean;
}

export const BudgetPacingCard: React.FC<BudgetPacingCardProps> = ({
  totalSpend,
  monthKey,
  settings,
  onEditBudget,
  isAmbient = false,
}) => {
  const isLight = settings.theme === 'light';
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const daysInMonth = new Date(year, month, 0).getDate();

  const now = new Date();
  const isCurrentMonth =
    now.getFullYear() === year && now.getMonth() + 1 === month;
  const currentDay = isCurrentMonth ? Math.min(now.getDate(), daysInMonth) : daysInMonth;
  const daysRemaining = Math.max(0, daysInMonth - currentDay);

  const budget = settings.monthlyBudget || 2000;
  const percentUsed = budget > 0 ? (totalSpend / budget) * 100 : 0;
  const expectedPacingPercent = (currentDay / daysInMonth) * 100;
  const remainingBudget = Math.max(0, budget - totalSpend);

  const dailyBurnRate = currentDay > 0 ? totalSpend / currentDay : 0;
  const allowableDailyRate = daysRemaining > 0 ? remainingBudget / daysRemaining : 0;

  const isOverBudget = totalSpend > budget;
  const isPacingHot = percentUsed > expectedPacingPercent + 5;

  const formatCurrency = (val: number) =>
    `${settings.currencySymbol}${Math.round(val).toLocaleString()}`;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border transition-all ${
        isLight
          ? 'bg-white border-stone-200/80 shadow-sm shadow-stone-900/5 p-5 sm:p-6'
          : isAmbient
          ? 'bg-forest-800 border-forest-700/60 p-5 sm:p-6'
          : 'bg-forest-800 border-forest-700/60 p-5 sm:p-6'
      }`}
    >
      <div className="relative z-10 flex flex-col justify-between h-full space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isLight
                  ? 'bg-forest-50 text-forest-700'
                  : 'bg-forest-700 text-forest-100'
              }`}
            >
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-base font-semibold tracking-tight ${isLight ? 'text-forest-700' : 'text-cream'}`}>
                Household Card Target
              </h3>
              <p className={`text-xs ${isLight ? 'text-stone-600' : 'text-stone-300'}`}>
                {isCurrentMonth ? `Day ${currentDay} of ${daysInMonth} (${daysRemaining}d left)` : 'Full Month Overview'}
              </p>
            </div>
          </div>

          <button
            onClick={onEditBudget}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-forest-50 text-forest-700 border-stone-200'
                : 'bg-forest-900/50 hover:bg-forest-700 text-forest-100 border-forest-700'
            }`}
          >
            Edit Goal
          </button>
        </div>

        {/* Big numbers */}
        <div className="flex items-baseline justify-between">
          <div>
            <div className={`text-2xl lg:text-3xl font-bold tracking-tight tabular-nums ${isLight ? 'text-forest-700' : 'text-cream'}`}>
              {formatCurrency(totalSpend)}
              <span className={`text-sm font-normal ml-1.5 ${isLight ? 'text-stone-500' : 'text-stone-300'}`}>
                / {formatCurrency(budget)}
              </span>
            </div>
            <div className="text-xs font-medium mt-1 flex items-center gap-1.5">
              {isOverBudget ? (
                <span className="text-terracotta-dark dark:text-terracotta-light flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Over goal by {formatCurrency(totalSpend - budget)}
                </span>
              ) : isPacingHot ? (
                <span className="text-terracotta-dark dark:text-terracotta-light flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Trending fast (+{Math.round(percentUsed - expectedPacingPercent)}% ahead)
                </span>
              ) : (
                <span className="text-forest-700 dark:text-forest-300 flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" />
                  On track ({formatCurrency(remainingBudget)} room)
                </span>
              )}
            </div>
          </div>

          <div className="text-right">
            <div
              className={`text-lg font-bold ${
                isOverBudget
                  ? 'text-terracotta-dark dark:text-terracotta-light'
                  : isPacingHot
                  ? 'text-terracotta-dark dark:text-terracotta-light'
                  : 'text-forest-700 dark:text-forest-300'
              }`}
            >
              {Math.round(percentUsed)}%
            </div>
            <div className={`text-[11px] ${isLight ? 'text-stone-500' : 'text-stone-300'}`}>Target Used</div>
          </div>
        </div>

        {/* Progress Bar with Today Marker */}
        <div className="space-y-1.5">
          <div
            className={`relative w-full h-2.5 rounded-full overflow-hidden ${
              isLight ? 'bg-stone-100' : 'bg-forest-900/70'
            }`}
          >
            <div
              className={`h-full transition-all duration-700 rounded-full ${
                isOverBudget
                  ? 'bg-terracotta'
                  : isPacingHot
                  ? 'bg-terracotta'
                  : 'bg-forest-500'
              }`}
              style={{ width: `${Math.min(100, percentUsed)}%` }}
            />
          </div>

          {/* Markers */}
          <div className={`flex justify-between text-[11px] tabular-nums ${isLight ? 'text-stone-500' : 'text-stone-300'}`}>
            <span>$0</span>
            {isCurrentMonth && (
              <span className={isLight ? 'text-stone-700 font-medium' : 'text-stone-200 font-medium'}>
                Pacing mark: {Math.round(expectedPacingPercent)}%
              </span>
            )}
            <span>{formatCurrency(budget)}</span>
          </div>
        </div>

        {/* Velocity stats */}
        {isCurrentMonth && (
          <div
            className={`grid grid-cols-2 gap-3 pt-4 border-t text-xs ${
              isLight ? 'border-stone-100' : 'border-forest-700/60'
            }`}
          >
            <div className={`p-3 rounded-xl ${isLight ? 'bg-stone-50' : 'bg-forest-900/50'}`}>
              <span className={`block text-[11px] font-medium ${isLight ? 'text-stone-500' : 'text-stone-300'}`}>
                Daily Burn
              </span>
              <span className={`text-sm font-semibold ${isLight ? 'text-stone-800' : 'text-stone-100'}`}>
                {formatCurrency(dailyBurnRate)}/day
              </span>
            </div>
            <div className={`p-3 rounded-xl ${isLight ? 'bg-stone-50' : 'bg-forest-900/50'}`}>
              <span className={`block text-[11px] font-medium ${isLight ? 'text-stone-500' : 'text-stone-300'}`}>
                Safe Daily Pace
              </span>
              <span
                className={`text-sm font-semibold ${
                  allowableDailyRate < dailyBurnRate
                    ? isLight ? 'text-terracotta-dark' : 'text-terracotta-light'
                    : isLight ? 'text-forest-700' : 'text-forest-300'
                }`}
              >
                {formatCurrency(allowableDailyRate)}/day
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

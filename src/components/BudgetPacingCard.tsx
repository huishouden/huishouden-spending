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
          ? 'bg-white border-slate-200/90 p-5 shadow-sm'
          : isAmbient
          ? 'bg-slate-900/80 border-slate-800 p-5'
          : 'bg-slate-900/90 backdrop-blur-md border-slate-800/80 p-5 shadow-lg shadow-black/20'
      }`}
    >
      {/* Background glow based on budget status */}
      <div
        className={`absolute -right-16 -top-16 w-44 h-44 rounded-full blur-3xl pointer-events-none opacity-20 ${
          isOverBudget
            ? 'bg-rose-500'
            : isPacingHot
            ? 'bg-amber-500'
            : 'bg-emerald-500'
        }`}
      />

      <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isLight
                  ? 'bg-indigo-50 border border-indigo-200 text-indigo-600'
                  : 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-400'
              }`}
            >
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-sm font-semibold tracking-tight ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                Household Card Target
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {isCurrentMonth ? `Day ${currentDay} of ${daysInMonth} (${daysRemaining}d left)` : 'Full Month Overview'}
              </p>
            </div>
          </div>

          <button
            onClick={onEditBudget}
            className={`text-xs px-2.5 py-1 rounded-lg border transition cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            Edit Goal
          </button>
        </div>

        {/* Big numbers */}
        <div className="flex items-baseline justify-between">
          <div>
            <div className={`text-2xl lg:text-3xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {formatCurrency(totalSpend)}
              <span className={`text-sm font-normal ml-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                / {formatCurrency(budget)}
              </span>
            </div>
            <div className="text-xs font-medium mt-0.5 flex items-center gap-1.5">
              {isOverBudget ? (
                <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Over goal by {formatCurrency(totalSpend - budget)}
                </span>
              ) : isPacingHot ? (
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Trending fast (+{Math.round(percentUsed - expectedPacingPercent)}% ahead)
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
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
                  ? 'text-rose-600 dark:text-rose-400'
                  : isPacingHot
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {Math.round(percentUsed)}%
            </div>
            <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Target Used</div>
          </div>
        </div>

        {/* Progress Bar with Today Marker */}
        <div className="space-y-1.5">
          <div
            className={`relative w-full h-3 rounded-full overflow-hidden ${
              isLight ? 'bg-slate-100 border border-slate-200/80' : 'bg-slate-800/90'
            }`}
          >
            <div
              className={`h-full transition-all duration-700 rounded-full ${
                isOverBudget
                  ? 'bg-rose-500'
                  : isPacingHot
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500'
              }`}
              style={{ width: `${Math.min(100, percentUsed)}%` }}
            />
          </div>

          {/* Markers */}
          <div className={`flex justify-between text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            <span>$0</span>
            {isCurrentMonth && (
              <span className={isLight ? 'text-slate-700 font-medium' : 'text-slate-300'}>
                Pacing mark: {Math.round(expectedPacingPercent)}%
              </span>
            )}
            <span>{formatCurrency(budget)}</span>
          </div>
        </div>

        {/* Velocity stats */}
        {isCurrentMonth && (
          <div
            className={`grid grid-cols-2 gap-2 pt-2 border-t text-xs ${
              isLight ? 'border-slate-100' : 'border-slate-800/80'
            }`}
          >
            <div className={`p-2 rounded-xl ${isLight ? 'bg-slate-50 border border-slate-200/60' : 'bg-slate-800/40'}`}>
              <span className={`block text-[10px] uppercase tracking-wider font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Daily Burn
              </span>
              <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                {formatCurrency(dailyBurnRate)}/day
              </span>
            </div>
            <div className={`p-2 rounded-xl ${isLight ? 'bg-slate-50 border border-slate-200/60' : 'bg-slate-800/40'}`}>
              <span className={`block text-[10px] uppercase tracking-wider font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Safe Daily Pace
              </span>
              <span
                className={`font-semibold ${
                  allowableDailyRate < dailyBurnRate
                    ? isLight ? 'text-amber-700' : 'text-amber-300'
                    : isLight ? 'text-emerald-700' : 'text-emerald-300'
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

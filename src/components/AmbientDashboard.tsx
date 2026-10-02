import React, { useState, useEffect } from 'react';
import { MonthlySummary, HouseholdSettings, SheetConfig } from '../types';
import { CardBadge } from './CardBadge';
import { CategoryIcon } from './CategoryIcon';
import { CATEGORY_COLORS } from '../services/mockData';
import {
  Clock,
  Maximize2,
  Minimize2,
  RefreshCw,
  Eye,
  EyeOff,
  Sun,
  Moon,
  SlidersHorizontal,
  FileSpreadsheet,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Tablet,
  HelpCircle,
} from 'lucide-react';

interface AmbientDashboardProps {
  monthlySummary: MonthlySummary;
  settings: HouseholdSettings;
  sheetConfig: SheetConfig | null;
  hasGoogleAuth?: boolean;
  onExitAmbient: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenSettings: () => void;
  onOpenSheetSync: () => void;
  onTogglePrivacy: () => void;
  onToggleTheme: () => void;
  onOpenPixelGuide?: () => void;
  onOpenSheetGuide?: () => void;
}

export const AmbientDashboard: React.FC<AmbientDashboardProps> = ({
  monthlySummary,
  settings,
  sheetConfig,
  hasGoogleAuth = false,
  onExitAmbient,
  onRefresh,
  isRefreshing,
  onOpenSettings,
  onOpenSheetSync,
  onTogglePrivacy,
  onToggleTheme,
  onOpenPixelGuide,
  onOpenSheetGuide,
}) => {
  const isLight = settings.theme === 'light';
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      );
      setDateStr(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const budget = settings.monthlyBudget || 2000;
  const totalSpend = monthlySummary.totalSpend;
  const percentUsed = budget > 0 ? (totalSpend / budget) * 100 : 0;
  const remaining = Math.max(0, budget - totalSpend);

  const [yearStr, monthStr] = monthlySummary.monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const daysInMonth = new Date(year, month, 0).getDate();
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  const currentDay = isCurrentMonth ? Math.min(now.getDate(), daysInMonth) : daysInMonth;
  const daysRemaining = Math.max(0, daysInMonth - currentDay);
  const expectedPacingPercent = (currentDay / daysInMonth) * 100;
  const isOverBudget = totalSpend > budget;
  const isPacingHot = percentUsed > expectedPacingPercent + 5;

  const formatAmount = (val: number) => {
    if (settings.showPrivacyBlur) return '••••••';
    return `${settings.currencySymbol}${Math.round(val).toLocaleString()}`;
  };

  const formatExactAmount = (val: number) => {
    if (settings.showPrivacyBlur) return '••••••';
    return `${settings.currencySymbol}${val.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-between p-6 sm:p-8 lg:p-10 select-none overflow-hidden font-sans transition-colors duration-300 ${
        isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Top Bar: Ambient Clock, Date, and Discreet Household Status */}
      <header
        className={`flex items-center justify-between pb-5 border-b ${
          isLight ? 'border-slate-200' : 'border-slate-900'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
              isLight
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-xs'
                : 'bg-gradient-to-br from-indigo-500/20 to-blue-600/20 border-indigo-500/30 text-indigo-400'
            }`}
          >
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div
              className={`text-3xl font-extrabold tracking-tight font-mono ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              {timeStr}
            </div>
            <div className={`text-xs sm:text-sm font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {dateStr}
            </div>
          </div>
        </div>

        {/* Ambient controls */}
        <div className="flex items-center gap-2">
          {sheetConfig ? (
            hasGoogleAuth ? (
              <div
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-600 shadow-xs'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className={`truncate max-w-[140px] font-medium ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                  {sheetConfig.spreadsheetTitle || 'Synced Sheet'}
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ml-1" />
              </div>
            ) : (
              <button
                onClick={onRefresh}
                title="Google session expired — tap to reconnect"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs cursor-pointer transition animate-pulse"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Reconnect Sheet</span>
              </button>
            )
          ) : (
            <button
              onClick={onOpenSheetSync}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                isLight
                  ? 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900 shadow-xs'
                  : 'bg-amber-950/60 hover:bg-amber-900/60 border-amber-700 text-amber-200'
              }`}
            >
              <span>⚠️ Demo Data • Connect Sheet</span>
            </button>
          )}

          {/* Theme switcher: Day / Night mode */}
          <button
            onClick={onToggleTheme}
            title={isLight ? 'Switch to Dark/Night Ambient mode' : 'Switch to Bright/Day mode'}
            className={`p-2.5 rounded-xl border transition cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
          >
            {isLight ? <Moon className="w-4 h-4 text-indigo-600" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            onClick={onTogglePrivacy}
            title={settings.showPrivacyBlur ? 'Show amounts' : 'Hide amounts (Guest mode)'}
            className={`p-2.5 rounded-xl border transition cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
            }`}
          >
            {settings.showPrivacyBlur ? <EyeOff className="w-4 h-4 text-amber-500" /> : <Eye className="w-4 h-4" />}
          </button>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh from Google Sheets"
            className={`p-2.5 rounded-xl border transition cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            title="Toggle Fullscreen Tablet Kiosk Mode"
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-indigo-500" /> : <Maximize2 className="w-4 h-4 text-indigo-500" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>

          {onOpenPixelGuide && (
            <button
              onClick={onOpenPixelGuide}
              title="Pixel Tablet Setup Guide & QR Code"
              className={`p-2.5 rounded-xl border transition cursor-pointer ${
                isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
              }`}
            >
              <Tablet className="w-4 h-4 text-indigo-500" />
            </button>
          )}

          {onOpenSheetGuide && (
            <button
              onClick={onOpenSheetGuide}
              title="Google Sheet & Drive Data Guide"
              className={`p-2.5 rounded-xl border transition cursor-pointer ${
                isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-emerald-500" />
            </button>
          )}

          <button
            onClick={onOpenSettings}
            title="Household Settings"
            className={`p-2.5 rounded-xl border transition cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          <button
            onClick={onExitAmbient}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition cursor-pointer flex items-center gap-1.5"
          >
            <span>Interactive Mode</span>
          </button>
        </div>
      </header>

      {/* Main Glance Section: High Legibility from Distance */}
      <main className="my-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Col: Giant Total Card Spend & Pacing (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium ${
              isLight
                ? 'bg-white border-slate-200 text-slate-700 shadow-2xs'
                : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{monthlySummary.monthName} · Household Card Total</span>
          </div>

          <div>
            <div
              className={`text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight font-sans leading-none ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              {formatAmount(totalSpend)}
            </div>
            <div className={`flex items-center gap-2 mt-3 text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              <span>Monthly Target: {formatAmount(budget)}</span>
              <span>•</span>
              <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                {monthlySummary.transactionCount} card charges
              </span>
            </div>
          </div>

          {/* Large Glance Pacing Bar */}
          <div
            className={`p-5 rounded-2xl border space-y-3 ${
              isLight
                ? 'bg-white border-slate-200/90 shadow-sm'
                : 'bg-slate-900/80 border-slate-800/80'
            }`}
          >
            <div className="flex items-center justify-between text-sm">
              <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>
                {isCurrentMonth ? `${daysRemaining} days left in month` : 'Monthly Total'}
              </span>
              <div className="flex items-center gap-1 font-bold">
                {isOverBudget ? (
                  <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    Over by {formatAmount(totalSpend - budget)}
                  </span>
                ) : isPacingHot ? (
                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    Trending High
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <TrendingDown className="w-4 h-4" />
                    On Track ({formatAmount(remaining)} left)
                  </span>
                )}
              </div>
            </div>

            <div
              className={`w-full rounded-full h-3.5 overflow-hidden ${
                isLight ? 'bg-slate-100 border border-slate-200/80' : 'bg-slate-800'
              }`}
            >
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isOverBudget
                    ? 'bg-rose-500'
                    : isPacingHot
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                }`}
                style={{ width: `${Math.min(100, percentUsed)}%` }}
              />
            </div>

            {isCurrentMonth && (
              <div
                className={`flex items-center justify-between text-xs pt-1 ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                <span>Paced at {Math.round(percentUsed)}% vs {Math.round(expectedPacingPercent)}% time elapsed</span>
                <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  {formatAmount(monthlySummary.dailyAverage)}/day avg
                </span>
              </div>
            )}
          </div>

          {/* Household Cards Quick Snapshot */}
          <div className="grid grid-cols-2 gap-3">
            {monthlySummary.cards.map((c) => {
              const isRobinhood = c.cardType === 'robinhood';
              return (
                <div
                  key={c.cardName}
                  className={`p-4 rounded-2xl border transition-all ${
                    isLight
                      ? isRobinhood
                        ? 'bg-gradient-to-b from-amber-50/90 to-white border-amber-200 shadow-xs'
                        : 'bg-gradient-to-b from-blue-50/90 to-white border-blue-200 shadow-xs'
                      : isRobinhood
                      ? 'bg-gradient-to-b from-amber-950/20 to-slate-900/60 border-amber-500/30'
                      : 'bg-gradient-to-b from-blue-950/20 to-slate-900/60 border-blue-500/30'
                  }`}
                >
                  <CardBadge cardName={c.cardName} cardType={c.cardType} size="sm" isLight={isLight} />
                  <div
                    className={`text-xl sm:text-2xl font-bold mt-2.5 ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    {formatAmount(c.total)}
                  </div>
                  <div className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {c.transactionCount} charges ({Math.round(c.percentage)}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Top Spending Categories & Recent Glance Feed (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Top Category Pillars */}
          <div
            className={`p-5 rounded-3xl border ${
              isLight
                ? 'bg-white border-slate-200/90 shadow-sm'
                : 'bg-slate-900/60 border-slate-800/80 backdrop-blur-md'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Top Spend Categories
              </h3>
              <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                Debits & mortgage excluded
              </span>
            </div>

            <div className="space-y-3.5">
              {monthlySummary.categories.slice(0, 5).map((cat) => {
                const colorMeta = CATEGORY_COLORS[cat.category] || {
                  bg: 'bg-slate-100 text-slate-800 border-slate-200',
                  darkBg: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
                  text: 'text-slate-700',
                  darkText: 'text-slate-400',
                  bar: 'bg-slate-500',
                };

                const iconClass = isLight ? colorMeta.bg : colorMeta.darkBg;

                return (
                  <div key={cat.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center border ${iconClass}`}
                        >
                          <CategoryIcon name={cat.category} className="w-3.5 h-3.5" />
                        </div>
                        <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                          {cat.category}
                        </span>
                        <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                          ({cat.transactionCount})
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          {cat.percentage.toFixed(0)}%
                        </span>
                        <span className={`font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {formatExactAmount(cat.total)}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`w-full rounded-full h-2 overflow-hidden ${
                        isLight ? 'bg-slate-100 border border-slate-200/50' : 'bg-slate-800/80'
                      }`}
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${colorMeta.bar}`}
                        style={{ width: `${Math.min(100, Math.max(4, cat.percentage))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Household Charges (Glance Feed) */}
          <div
            className={`p-5 rounded-3xl border ${
              isLight
                ? 'bg-white border-slate-200/90 shadow-sm'
                : 'bg-slate-900/60 border-slate-800/80 backdrop-blur-md'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Latest Card Charges
              </h3>
              <button
                onClick={onExitAmbient}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
              >
                View all ({monthlySummary.transactions.length}) →
              </button>
            </div>

            <div className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-slate-800/50'}`}>
              {monthlySummary.transactions.slice(0, 4).map((t) => (
                <div key={t.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                        isLight
                          ? 'bg-slate-100 border-slate-200 text-slate-600'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      <CategoryIcon name={t.category} className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className={`text-sm font-semibold truncate ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                        {t.merchant}
                      </div>
                      <div className={`text-[11px] flex items-center gap-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        <span>{t.date}</span>
                        <span>•</span>
                        <span>{t.cardName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {formatExactAmount(t.amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Footer: Status and Hub Dock Message */}
      <footer
        className={`flex flex-col sm:flex-row items-center justify-between pt-4 border-t text-xs gap-2 ${
          isLight ? 'border-slate-200 text-slate-500' : 'border-slate-900 text-slate-500'
        }`}
      >
        <div className="flex items-center gap-2">
          <span>Pixel Tablet Ambient Mode</span>
          <span>•</span>
          <span>{settings.householdName}</span>
        </div>

        <div className="flex items-center gap-3">
          {sheetConfig ? (
            <span className={`flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              Synced via Google Sheets
            </span>
          ) : (
            <button
              onClick={onOpenSheetSync}
              className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Connect Google Sheet
            </button>
          )}
          <span>•</span>
          <button
            onClick={onExitAmbient}
            className={`hover:underline cursor-pointer ${isLight ? 'text-slate-600 hover:text-slate-900' : 'hover:text-slate-300'}`}
          >
            Tap anywhere to interact
          </button>
        </div>
      </footer>
    </div>
  );
};

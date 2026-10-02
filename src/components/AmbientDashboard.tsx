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
  AlertTriangle,
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
        isLight ? 'bg-cream text-stone-800' : 'bg-forest-900 text-stone-100'
      }`}
    >
      {/* Top Bar: Ambient Clock, Date, and Discreet Household Status */}
      <header
        className={`flex items-center justify-between pb-6 border-b ${
          isLight ? 'border-stone-200/70' : 'border-forest-800'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              isLight
                ? 'bg-forest-700 text-white'
                : 'bg-forest-800 text-forest-200'
            }`}
          >
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div
              className={`text-3xl font-bold tracking-tight tabular-nums ${
                isLight ? 'text-forest-700' : 'text-cream'
              }`}
            >
              {timeStr}
            </div>
            <div className={`text-xs sm:text-sm font-medium ${isLight ? 'text-stone-600' : 'text-stone-300'}`}>
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
                    ? 'bg-white border-stone-200 text-stone-600'
                    : 'bg-forest-800 border-forest-700 text-stone-300'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-forest-700 dark:text-forest-300" />
                <span className={`truncate max-w-[140px] font-medium ${isLight ? 'text-stone-800' : 'text-stone-100'}`}>
                  {sheetConfig.spreadsheetTitle || 'Synced Sheet'}
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-forest-700 dark:text-forest-300 ml-1" />
              </div>
            ) : (
              <button
                onClick={onRefresh}
                title="Google session expired — tap to reconnect"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-terracotta-dark text-xs font-semibold bg-terracotta-dark hover:bg-terracotta text-white cursor-pointer transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Reconnect Sheet</span>
              </button>
            )
          ) : (
            <button
              onClick={onOpenSheetSync}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition cursor-pointer ${
                isLight
                  ? 'bg-terracotta-light/60 hover:bg-terracotta-light border-terracotta/40 text-terracotta-dark'
                  : 'bg-terracotta/15 hover:bg-terracotta/25 border-terracotta/50 text-terracotta-light'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Demo Data • Connect Sheet</span>
            </button>
          )}

          {/* Theme switcher: Day / Night mode */}
          <button
            onClick={onToggleTheme}
            title={isLight ? 'Switch to Dark/Night Ambient mode' : 'Switch to Bright/Day mode'}
            className={`p-2.5 rounded-xl border transition cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
                : 'bg-forest-800 hover:bg-forest-700 text-stone-200 border-forest-700'
            }`}
          >
            {isLight ? <Moon className="w-4 h-4 text-forest-700" /> : <Sun className="w-4 h-4 text-forest-200" />}
          </button>

          <button
            onClick={onTogglePrivacy}
            title={settings.showPrivacyBlur ? 'Show amounts' : 'Hide amounts (Guest mode)'}
            className={`p-2.5 rounded-xl border transition cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
                : 'bg-forest-800 hover:bg-forest-700 text-stone-200 border-forest-700'
            }`}
          >
            {settings.showPrivacyBlur ? <EyeOff className="w-4 h-4 text-terracotta-dark dark:text-terracotta-light" /> : <Eye className="w-4 h-4" />}
          </button>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh from Google Sheets"
            className={`p-2.5 rounded-xl border transition cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
                : 'bg-forest-800 hover:bg-forest-700 text-stone-200 border-forest-700'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-forest-600 dark:text-forest-300' : ''}`} />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            title="Toggle Fullscreen Tablet Kiosk Mode"
            className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
                : 'bg-forest-800 hover:bg-forest-700 text-stone-200 border-forest-700'
            }`}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-forest-600 dark:text-forest-300" /> : <Maximize2 className="w-4 h-4 text-forest-600 dark:text-forest-300" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>

          {onOpenPixelGuide && (
            <button
              onClick={onOpenPixelGuide}
              title="Pixel Tablet Setup Guide & QR Code"
              className={`p-2.5 rounded-xl border transition cursor-pointer ${
                isLight
                  ? 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
                  : 'bg-forest-800 hover:bg-forest-700 text-stone-200 border-forest-700'
              }`}
            >
              <Tablet className="w-4 h-4 text-forest-600 dark:text-forest-300" />
            </button>
          )}

          {onOpenSheetGuide && (
            <button
              onClick={onOpenSheetGuide}
              title="Google Sheet & Drive Data Guide"
              className={`p-2.5 rounded-xl border transition cursor-pointer ${
                isLight
                  ? 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
                  : 'bg-forest-800 hover:bg-forest-700 text-stone-200 border-forest-700'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-forest-700 dark:text-forest-300" />
            </button>
          )}

          <button
            onClick={onOpenSettings}
            title="Household Settings"
            className={`p-2.5 rounded-xl border transition cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
                : 'bg-forest-800 hover:bg-forest-700 text-stone-200 border-forest-700'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          <button
            onClick={onExitAmbient}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer flex items-center gap-1.5 ${
              isLight ? 'bg-forest-700 hover:bg-forest-600 text-white' : 'bg-forest-400 hover:bg-forest-300 text-forest-900'
            }`}
          >
            <span>Interactive Mode</span>
          </button>
        </div>
      </header>

      {/* Main Glance Section: High Legibility from Distance */}
      <main className="my-auto py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        {/* Left Col: Giant Total Card Spend & Pacing (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium ${
              isLight
                ? 'bg-white border-stone-200 text-stone-700'
                : 'bg-forest-800 border-forest-700 text-stone-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-forest-500" />
            <span>{monthlySummary.monthName} · Household Card Total</span>
          </div>

          <div>
            <div
              className={`text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight tabular-nums leading-none ${
                isLight ? 'text-forest-700' : 'text-cream'
              }`}
            >
              {formatAmount(totalSpend)}
            </div>
            <div className={`flex items-center gap-2 mt-4 text-sm ${isLight ? 'text-stone-600' : 'text-stone-300'}`}>
              <span>Monthly Target: {formatAmount(budget)}</span>
              <span>•</span>
              <span className={`font-semibold ${isLight ? 'text-stone-800' : 'text-stone-100'}`}>
                {monthlySummary.transactionCount} card charges
              </span>
            </div>
          </div>

          {/* Large Glance Pacing Bar */}
          <div
            className={`p-5 sm:p-6 rounded-2xl border space-y-3 ${
              isLight
                ? 'bg-white border-stone-200/80 shadow-sm shadow-stone-900/5'
                : 'bg-forest-800 border-forest-700/60'
            }`}
          >
            <div className="flex items-center justify-between text-sm">
              <span className={isLight ? 'text-stone-600' : 'text-stone-300'}>
                {isCurrentMonth ? `${daysRemaining} days left in month` : 'Monthly Total'}
              </span>
              <div className="flex items-center gap-1 font-semibold">
                {isOverBudget ? (
                  <span className="text-terracotta-dark dark:text-terracotta-light flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    Over by {formatAmount(totalSpend - budget)}
                  </span>
                ) : isPacingHot ? (
                  <span className="text-terracotta-dark dark:text-terracotta-light flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    Trending High
                  </span>
                ) : (
                  <span className="text-forest-700 dark:text-forest-300 flex items-center gap-1">
                    <TrendingDown className="w-4 h-4" />
                    On Track ({formatAmount(remaining)} left)
                  </span>
                )}
              </div>
            </div>

            <div
              className={`w-full rounded-full h-3 overflow-hidden ${
                isLight ? 'bg-stone-100' : 'bg-forest-900/70'
              }`}
            >
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isOverBudget
                    ? 'bg-terracotta'
                    : isPacingHot
                    ? 'bg-terracotta'
                    : 'bg-forest-500'
                }`}
                style={{ width: `${Math.min(100, percentUsed)}%` }}
              />
            </div>

            {isCurrentMonth && (
              <div
                className={`flex items-center justify-between text-xs pt-1 ${
                  isLight ? 'text-stone-600' : 'text-stone-300'
                }`}
              >
                <span>Paced at {Math.round(percentUsed)}% vs {Math.round(expectedPacingPercent)}% time elapsed</span>
                <span className={`font-semibold ${isLight ? 'text-stone-800' : 'text-stone-100'}`}>
                  {formatAmount(monthlySummary.dailyAverage)}/day avg
                </span>
              </div>
            )}
          </div>

          {/* Household Cards Quick Snapshot */}
          <div className="grid grid-cols-2 gap-4">
            {monthlySummary.cards.map((c) => {
              return (
                <div
                  key={c.cardName}
                  className={`p-4 rounded-2xl border transition-all ${
                    isLight
                      ? 'bg-white border-stone-200/80 shadow-sm shadow-stone-900/5'
                      : 'bg-forest-800 border-forest-700/60'
                  }`}
                >
                  <CardBadge cardName={c.cardName} cardType={c.cardType} size="sm" isLight={isLight} />
                  <div
                    className={`text-xl sm:text-2xl font-bold mt-3 tabular-nums ${
                      isLight ? 'text-forest-700' : 'text-cream'
                    }`}
                  >
                    {formatAmount(c.total)}
                  </div>
                  <div className={`text-xs mt-1 ${isLight ? 'text-stone-600' : 'text-stone-300'}`}>
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
            className={`p-5 sm:p-6 rounded-2xl border ${
              isLight
                ? 'bg-white border-stone-200/80 shadow-sm shadow-stone-900/5'
                : 'bg-forest-800 border-forest-700/60'
            }`}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className={`text-base font-semibold ${isLight ? 'text-forest-700' : 'text-cream'}`}>
                Top Spend Categories
              </h3>
              <span className={`text-xs ${isLight ? 'text-stone-500' : 'text-stone-300'}`}>
                Debits & mortgage excluded
              </span>
            </div>

            <div className="space-y-3.5">
              {monthlySummary.categories.slice(0, 5).map((cat) => {
                const colorMeta = CATEGORY_COLORS[cat.category] || {
                  bg: 'bg-stone-100 text-stone-800 border-stone-200',
                  darkBg: 'bg-stone-500/15 text-stone-300 border-stone-500/20',
                  text: 'text-stone-700',
                  darkText: 'text-stone-400',
                  bar: 'bg-cat-stone',
                };

                const iconClass = isLight ? colorMeta.bg : colorMeta.darkBg;

                return (
                  <div key={cat.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconClass}`}
                        >
                          <CategoryIcon name={cat.category} className="w-3.5 h-3.5" />
                        </div>
                        <span className={`font-medium ${isLight ? 'text-stone-800' : 'text-stone-100'}`}>
                          {cat.category}
                        </span>
                        <span className={`text-xs ${isLight ? 'text-stone-500' : 'text-stone-300'}`}>
                          ({cat.transactionCount})
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-xs ${isLight ? 'text-stone-500' : 'text-stone-300'}`}>
                          {cat.percentage.toFixed(0)}%
                        </span>
                        <span className={`font-semibold tracking-tight tabular-nums ${isLight ? 'text-stone-800' : 'text-cream'}`}>
                          {formatExactAmount(cat.total)}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`w-full rounded-full h-2 overflow-hidden ${
                        isLight ? 'bg-stone-100' : 'bg-forest-900/70'
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
            className={`p-5 sm:p-6 rounded-2xl border ${
              isLight
                ? 'bg-white border-stone-200/80 shadow-sm shadow-stone-900/5'
                : 'bg-forest-800 border-forest-700/60'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-base font-semibold ${isLight ? 'text-forest-700' : 'text-cream'}`}>
                Latest Card Charges
              </h3>
              <button
                onClick={onExitAmbient}
                className="text-xs text-forest-700 dark:text-forest-300 hover:underline font-medium cursor-pointer"
              >
                View all ({monthlySummary.transactions.length}) →
              </button>
            </div>

            <div className={`divide-y ${isLight ? 'divide-stone-100' : 'divide-forest-700/50'}`}>
              {monthlySummary.transactions.slice(0, 4).map((t) => (
                <div key={t.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isLight
                          ? 'bg-stone-100 text-stone-600'
                          : 'bg-forest-900/60 text-stone-300'
                      }`}
                    >
                      <CategoryIcon name={t.category} className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className={`text-sm font-medium truncate ${isLight ? 'text-stone-800' : 'text-stone-100'}`}>
                        {t.merchant}
                      </div>
                      <div className={`text-xs flex items-center gap-2 ${isLight ? 'text-stone-500' : 'text-stone-300'}`}>
                        <span>{t.date}</span>
                        <span>•</span>
                        <span>{t.cardName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className={`text-sm font-semibold tabular-nums ${isLight ? 'text-stone-800' : 'text-cream'}`}>
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
          isLight ? 'border-stone-200/70 text-stone-500' : 'border-forest-800 text-stone-400'
        }`}
      >
        <div className="flex items-center gap-2">
          <span>Pixel Tablet Ambient Mode</span>
          <span>•</span>
          <span>{settings.householdName}</span>
        </div>

        <div className="flex items-center gap-3">
          {sheetConfig ? (
            <span className={`flex items-center gap-1.5 ${isLight ? 'text-stone-600' : 'text-stone-300'}`}>
              <CheckCircle2 className="w-3 h-3 text-forest-700 dark:text-forest-300" />
              Synced via Google Sheets
            </span>
          ) : (
            <button
              onClick={onOpenSheetSync}
              className="text-forest-700 dark:text-forest-300 hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Connect Google Sheet
            </button>
          )}
          <span>•</span>
          <button
            onClick={onExitAmbient}
            className={`hover:underline cursor-pointer ${isLight ? 'text-stone-600 hover:text-stone-900' : 'text-stone-300 hover:text-white'}`}
          >
            Tap anywhere to interact
          </button>
        </div>
      </footer>
    </div>
  );
};

import React, { useState } from 'react';
import { MonthlySummary, HouseholdSettings, SheetConfig } from '../types';
import { BudgetPacingCard } from './BudgetPacingCard';
import { CardBreakdown } from './CardBreakdown';
import { CategoryList } from './CategoryList';
import { TransactionList } from './TransactionList';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FileSpreadsheet,
  Sliders,
  Tv,
  Eye,
  EyeOff,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Receipt,
  Coins,
  CheckCircle2,
  Sun,
  Moon,
  Tablet,
  HelpCircle,
  Download,
  Zap,
  Maximize2,
  Minimize2,
  Menu,
  X,
  Upload,
} from 'lucide-react';
import { usePWAInstall } from '../usePWAInstall';

interface InteractiveDashboardProps {
  monthlySummary: MonthlySummary;
  availableMonths: string[];
  selectedMonthKey: string;
  onSelectMonth: (monthKey: string) => void;
  settings: HouseholdSettings;
  sheetConfig: SheetConfig | null;
  hasGoogleAuth?: boolean;
  onReconnectGoogle?: () => void;
  onEnterAmbient: () => void;
  onOpenSettings: () => void;
  onOpenSheetSync: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onTogglePrivacy: () => void;
  onToggleTheme: () => void;
  selectedCard: string | null;
  onSelectCard: (card: string | null) => void;
  selectedCategory: string | null;
  onSelectCategory: (cat: string | null) => void;
  onOpenPixelGuide?: () => void;
  onOpenSheetGuide?: (tab?: 'quickstart' | 'gmail_sync' | 'columns' | 'chase_robinhood' | 'template') => void;
}

export const InteractiveDashboard: React.FC<InteractiveDashboardProps> = ({
  monthlySummary,
  availableMonths,
  selectedMonthKey,
  onSelectMonth,
  settings,
  sheetConfig,
  hasGoogleAuth = false,
  onReconnectGoogle,
  onEnterAmbient,
  onOpenSettings,
  onOpenSheetSync,
  onRefresh,
  isRefreshing,
  onTogglePrivacy,
  onToggleTheme,
  selectedCard,
  onSelectCard,
  selectedCategory,
  onSelectCategory,
  onOpenPixelGuide,
  onOpenSheetGuide,
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const isLight = settings.theme === 'light';
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const currentMonthIdx = availableMonths.indexOf(selectedMonthKey);
  const hasNextMonth = currentMonthIdx > 0;
  const hasPrevMonth = currentMonthIdx < availableMonths.length - 1;

  const goToNextMonth = () => {
    if (hasNextMonth) onSelectMonth(availableMonths[currentMonthIdx - 1]);
  };

  const goToPrevMonth = () => {
    if (hasPrevMonth) onSelectMonth(availableMonths[currentMonthIdx + 1]);
  };

  const formatCurrency = (val: number) => {
    if (settings.showPrivacyBlur) return '••••••';
    return `${settings.currencySymbol}${val.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatShortCurrency = (val: number) => {
    if (settings.showPrivacyBlur) return '••••••';
    return `${settings.currencySymbol}${Math.round(val).toLocaleString()}`;
  };

  // Previous month spend delta
  const prevSpend = monthlySummary.previousMonthSpend;
  const spendDiff = prevSpend ? monthlySummary.totalSpend - prevSpend : 0;
  const spendPercentDiff = prevSpend ? (spendDiff / prevSpend) * 100 : 0;

  // Largest single transaction
  const largestTx = [...monthlySummary.transactions].sort((a, b) => b.amount - a.amount)[0];

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
        isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Top Tablet Navigation Header */}
      <header
        className={`sticky top-0 z-30 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between border-b backdrop-blur-xl ${
          isLight
            ? 'bg-white/90 border-slate-200/90 shadow-2xs'
            : 'bg-slate-950/80 border-slate-900'
        }`}
      >
        {/* Left: Branding & Month Selector */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h1 className={`text-base font-bold tracking-tight leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {settings.householdName}
              </h1>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Card charges & category monitor
              </p>
            </div>
          </div>

          {/* Month Switcher Carousel */}
          <div
            className={`flex items-center rounded-xl p-1 border ${
              isLight ? 'bg-slate-100 border-slate-200/80' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <button
              onClick={goToPrevMonth}
              disabled={!hasPrevMonth}
              className={`p-1.5 rounded-lg transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span
              className={`text-xs sm:text-sm font-semibold px-3 font-mono ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              {monthlySummary.monthName}
            </span>
            <button
              onClick={goToNextMonth}
              disabled={!hasNextMonth}
              className={`p-1.5 rounded-lg transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Actions (Clean Top Bar with Refresh, Dock Mode, and Unified Setup Menu) */}
        <div className="flex items-center gap-2 sm:gap-3 relative">
          {/* Quick Refresh from Google Sheets */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`p-2 rounded-xl border transition cursor-pointer relative ${
              sheetConfig && !hasGoogleAuth
                ? isLight
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-amber-950/50 hover:bg-amber-900 text-amber-300 border-amber-800'
                : isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
            title={
              sheetConfig && !hasGoogleAuth
                ? 'Google authorization expired — tap to reconnect and refresh'
                : 'Refresh latest transactions from Google Sheets'
            }
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            {sheetConfig && !hasGoogleAuth && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-950" />
            )}
          </button>

          {/* Ambient Hub Mode Button (For Pixel Tablet on Dock) */}
          <button
            onClick={onEnterAmbient}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/25 transition cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Tv className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dock Mode</span>
            <span className="sm:hidden">Dock</span>
          </button>

          {/* Single Unified Setup & Settings Menu Button */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label="Configuration and Settings Menu"
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                isMenuOpen
                  ? isLight
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'bg-indigo-950/70 border-indigo-700 text-indigo-300'
                  : isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800'
              }`}
            >
              <Menu className="w-4 h-4" />
              <span>Menu</span>
              {sheetConfig ? (
                hasGoogleAuth ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Google Sheet Connected & Synced" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Google Authorization Expired (Click to Reconnect)" />
                )
              ) : (
                <span className="w-2 h-2 rounded-full bg-slate-400" title="Using Demo Data" />
              )}
            </button>

            {/* Dropdown Menu Flyout */}
            {isMenuOpen && (
              <>
                {/* Backdrop overlay to close when clicking outside */}
                <div
                  className="fixed inset-0 z-40 bg-black/10 backdrop-blur-xs sm:bg-transparent sm:backdrop-blur-none"
                  onClick={() => setIsMenuOpen(false)}
                />

                <div
                  className={`absolute right-0 top-full mt-2 w-80 sm:w-88 rounded-2xl border shadow-2xl z-50 p-4 space-y-4 max-h-[85vh] overflow-y-auto animate-fadeIn ${
                    isLight
                      ? 'bg-white/98 border-slate-200 text-slate-800 shadow-slate-300/50'
                      : 'bg-slate-900/98 border-slate-800 text-slate-100 shadow-black/80'
                  }`}
                >
                  {/* Menu Title Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-indigo-500" />
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Configuration &amp; Setup
                      </h3>
                    </div>
                    <button
                      onClick={() => setIsMenuOpen(false)}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Google Sheet Connection Status Card */}
                  <div
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                      sheetConfig
                        ? hasGoogleAuth
                          ? isLight
                            ? 'bg-emerald-50/80 border-emerald-200'
                            : 'bg-emerald-950/30 border-emerald-800/60'
                          : isLight
                          ? 'bg-amber-50/90 border-amber-300'
                          : 'bg-amber-950/40 border-amber-700/60'
                        : isLight
                        ? 'bg-slate-100 border-slate-200'
                        : 'bg-slate-800/50 border-slate-700'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            sheetConfig
                              ? hasGoogleAuth
                                ? 'bg-emerald-500'
                                : 'bg-amber-500 animate-pulse'
                              : 'bg-slate-400'
                          }`}
                        />
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            sheetConfig
                              ? hasGoogleAuth
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-amber-700 dark:text-amber-400 font-extrabold'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {sheetConfig
                            ? hasGoogleAuth
                              ? 'Connected & Synced'
                              : 'Session Expired • Reconnect'
                            : 'Sample Data Only'}
                        </span>
                      </div>
                      <p className="text-xs font-semibold truncate mt-0.5">
                        {sheetConfig ? sheetConfig.spreadsheetTitle : 'No sheet linked yet'}
                      </p>
                    </div>

                    {sheetConfig ? (
                      hasGoogleAuth ? (
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            onOpenSheetSync();
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                            isLight
                              ? 'bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700'
                          }`}
                        >
                          Manage
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            if (onReconnectGoogle) {
                              onReconnectGoogle();
                            } else {
                              onRefresh();
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs"
                        >
                          Reconnect
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenSheetSync();
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white"
                      >
                        Connect Sheet
                      </button>
                    )}
                  </div>

                  {/* Section 1: Spreadsheet & Card Sync */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2">
                      Card Sync &amp; Data
                    </span>

                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenSheetSync();
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl transition cursor-pointer ${
                        isLight ? 'hover:bg-slate-100' : 'hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-semibold">Google Sheet Sync</p>
                          <p className="text-[11px] text-slate-400">Manage spreadsheet ID &amp; card tabs</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenSheetSync();
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl transition cursor-pointer ${
                        isLight ? 'hover:bg-slate-100' : 'hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold">Import Chase CSVs</p>
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-400 font-bold">New</span>
                          </div>
                          <p className="text-[11px] text-slate-400">Clean older data &amp; auto-filter payments</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    {onOpenSheetGuide && (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenSheetGuide('gmail_sync');
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl transition cursor-pointer ${
                          isLight ? 'hover:bg-slate-100' : 'hover:bg-slate-800/70'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                            <Zap className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-semibold">Automated Gmail Sync</p>
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 font-bold">Free</span>
                            </div>
                            <p className="text-[11px] text-slate-400">15-min background script for Chase &amp; Robinhood</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    )}

                    {onOpenSheetGuide && (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenSheetGuide('quickstart');
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl transition cursor-pointer ${
                          isLight ? 'hover:bg-slate-100' : 'hover:bg-slate-800/70'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-slate-500/10 text-slate-400 flex items-center justify-center shrink-0">
                            <HelpCircle className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-semibold">Spreadsheet Columns &amp; Guide</p>
                            <p className="text-[11px] text-slate-400">Templates, headers, and format tips</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    )}
                  </div>

                  {/* Section 2: Tablet & Display Options */}
                  <div className="space-y-1 pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2">
                      Tablet &amp; Display
                    </span>

                    {onOpenPixelGuide && (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenPixelGuide();
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl transition cursor-pointer ${
                          isLight ? 'hover:bg-slate-100' : 'hover:bg-slate-800/70'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                            <Tablet className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-semibold">Pixel Tablet Setup &amp; PWA</p>
                            <p className="text-[11px] text-slate-400">Kiosk instructions &amp; Hub mode</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    )}

                    {/* Fullscreen Kiosk toggle */}
                    <button
                      onClick={() => {
                        toggleFullscreen();
                        setIsMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl transition cursor-pointer ${
                        isLight ? 'hover:bg-slate-100' : 'hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-slate-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-semibold">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Kiosk Mode'}</p>
                          <p className="text-[11px] text-slate-400">Hides browser address bar on tablet</p>
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">{isFullscreen ? 'Active' : 'Off'}</span>
                    </button>

                    {/* Theme switcher */}
                    <button
                      onClick={() => {
                        onToggleTheme();
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl transition cursor-pointer ${
                        isLight ? 'hover:bg-slate-100' : 'hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-slate-500/10 flex items-center justify-center shrink-0">
                          {isLight ? <Moon className="w-4 h-4 text-indigo-600" /> : <Sun className="w-4 h-4 text-amber-400" />}
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-semibold">Appearance</p>
                          <p className="text-[11px] text-slate-400">{isLight ? 'Light theme active' : 'Dark theme active'}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        {isLight ? 'Dark' : 'Light'}
                      </span>
                    </button>

                    {/* Privacy mode toggle */}
                    <button
                      onClick={() => {
                        onTogglePrivacy();
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl transition cursor-pointer ${
                        isLight ? 'hover:bg-slate-100' : 'hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-slate-500/10 flex items-center justify-center shrink-0">
                          {settings.showPrivacyBlur ? <EyeOff className="w-4 h-4 text-amber-500" /> : <Eye className="w-4 h-4 text-slate-400" />}
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-semibold">Privacy Blur</p>
                          <p className="text-[11px] text-slate-400">
                            {settings.showPrivacyBlur ? 'Dollar amounts are blurred' : 'Dollar amounts are visible'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        {settings.showPrivacyBlur ? 'Unhide' : 'Hide'}
                      </span>
                    </button>
                  </div>

                  {/* Section 3: Household Budget & Preferences */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenSettings();
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl transition cursor-pointer ${
                        isLight ? 'hover:bg-slate-100' : 'hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                          <Sliders className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-semibold">Budget &amp; Filter Settings</p>
                          <p className="text-[11px] text-slate-400">Budget, currency symbol &amp; exclusions</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Sample Data Alert Banner - Shown whenever no Google Sheet is connected */}
        {!sheetConfig && (
          <div
            className={`p-4 sm:p-5 rounded-2xl border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-fadeIn ${
              isLight
                ? 'bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-amber-50/90 border-amber-300 text-amber-950'
                : 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/30 border-amber-500/40 text-amber-200'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs font-bold text-lg">
                📊
              </div>
              <div>
                <div className="text-sm sm:text-base font-extrabold flex items-center gap-2">
                  <span>Currently Showing Sample Demo Data</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-200 text-amber-900 dark:bg-amber-900/80 dark:text-amber-200">
                    Demo
                  </span>
                </div>
                <p className={`text-xs mt-0.5 ${isLight ? 'text-amber-900/80' : 'text-amber-300/80'}`}>
                  Your Google Sheet is not connected yet on this tablet. Tap the button to select or link your Google Drive spreadsheet to see your real Chase &amp; Robinhood credit card charges.
                </p>
              </div>
            </div>
            <button
              onClick={onOpenSheetSync}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition cursor-pointer shrink-0"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Connect My Google Sheet</span>
            </button>
          </div>
        )}
        {/* Tablet & Sheet Quick Setup Bar */}
        <div
          className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs transition-colors ${
            isLight
              ? 'bg-gradient-to-r from-indigo-50/80 via-white to-blue-50/60 border-indigo-100 text-slate-800'
              : 'bg-gradient-to-r from-indigo-950/40 via-slate-900 to-blue-950/30 border-indigo-900/40 text-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold flex items-center gap-1.5">
                <span>Pixel Tablet & Google Drive Setup Guides</span>
                <span className="px-1.5 py-0.2 rounded-md bg-indigo-600 text-white text-[10px] font-medium">Ready</span>
              </div>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {sheetConfig
                  ? `Synced to "${sheetConfig.spreadsheetTitle}" • Always-on kitchen display ready`
                  : 'Add this dashboard to your Pixel Tablet dock and learn where to format data in Google Drive.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
            {onOpenPixelGuide && (
              <button
                onClick={onOpenPixelGuide}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  isLight
                    ? 'bg-white hover:bg-slate-50 text-indigo-700 border-indigo-200 shadow-2xs'
                    : 'bg-indigo-900/40 hover:bg-indigo-900/70 text-indigo-300 border-indigo-800'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
                <span>Pixel Tablet Guide</span>
              </button>
            )}

            {onOpenSheetGuide && (
              <button
                onClick={() => onOpenSheetGuide('quickstart')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  isLight
                    ? 'bg-white hover:bg-slate-50 text-emerald-800 border-emerald-200 shadow-2xs'
                    : 'bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Google Sheet Guide</span>
              </button>
            )}

            {isInstallable && !isInstalled && (
              <button
                onClick={install}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install App</span>
              </button>
            )}
          </div>
        </div>

        {/* Top KPI Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Card Spend */}
          <div
            className={`rounded-2xl p-4 sm:p-5 relative overflow-hidden transition-all border ${
              isLight
                ? 'bg-white border-slate-200/90 shadow-sm'
                : 'bg-slate-900/90 border-slate-800/80 shadow-lg shadow-black/20'
            }`}
          >
            <span className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Household Card Spend
            </span>
            <div
              className={`text-2xl sm:text-3xl font-extrabold mt-1 tracking-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              {formatCurrency(monthlySummary.totalSpend)}
            </div>
            {prevSpend ? (
              <div className="flex items-center gap-1 text-xs mt-1 font-medium">
                {spendDiff > 0 ? (
                  <span className="text-amber-600 dark:text-amber-400 flex items-center">
                    <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                    +{Math.round(spendPercentDiff)}% vs last mo
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center">
                    <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                    {Math.round(spendPercentDiff)}% vs last mo
                  </span>
                )}
              </div>
            ) : (
              <div className={`text-xs mt-1 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                Based on card sync
              </div>
            )}
          </div>

          {/* Card 2: Daily Velocity */}
          <div
            className={`rounded-2xl p-4 sm:p-5 relative overflow-hidden transition-all border ${
              isLight
                ? 'bg-white border-slate-200/90 shadow-sm'
                : 'bg-slate-900/90 border-slate-800/80 shadow-lg shadow-black/20'
            }`}
          >
            <span className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Daily Card Velocity
            </span>
            <div
              className={`text-2xl sm:text-3xl font-extrabold mt-1 tracking-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              {formatShortCurrency(monthlySummary.dailyAverage)}
              <span className={`text-xs font-normal ml-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                /day
              </span>
            </div>
            <div className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Projected end: {formatShortCurrency(monthlySummary.projectedMonthEnd)}
            </div>
          </div>

          {/* Card 3: Total Transactions */}
          <div
            className={`rounded-2xl p-4 sm:p-5 relative overflow-hidden transition-all border ${
              isLight
                ? 'bg-white border-slate-200/90 shadow-sm'
                : 'bg-slate-900/90 border-slate-800/80 shadow-lg shadow-black/20'
            }`}
          >
            <span className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Total Charges
            </span>
            <div
              className={`text-2xl sm:text-3xl font-extrabold mt-1 tracking-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              {monthlySummary.transactionCount}
            </div>
            <div className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Excludes mortgage & debits
            </div>
          </div>

          {/* Card 4: Top Category or Rewards */}
          <div
            className={`rounded-2xl p-4 sm:p-5 relative overflow-hidden transition-all border ${
              isLight
                ? 'bg-white border-slate-200/90 shadow-sm'
                : 'bg-slate-900/90 border-slate-800/80 shadow-lg shadow-black/20'
            }`}
          >
            <span className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Top Category
            </span>
            <div
              className={`text-xl sm:text-2xl font-bold mt-1 tracking-tight truncate ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              {monthlySummary.categories[0]?.category || 'N/A'}
            </div>
            <div className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {monthlySummary.categories[0]
                ? `${formatShortCurrency(monthlySummary.categories[0].total)} (${monthlySummary.categories[0].percentage.toFixed(0)}%)`
                : 'No charges'}
            </div>
          </div>
        </div>

        {/* Middle Section: Budget Pacing and Active Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <BudgetPacingCard
              totalSpend={monthlySummary.totalSpend}
              monthKey={monthlySummary.monthKey}
              settings={settings}
              onEditBudget={onOpenSettings}
            />
          </div>

          <div className="lg:col-span-7">
            <CardBreakdown
              cards={monthlySummary.cards}
              currencySymbol={settings.currencySymbol}
              selectedCard={selectedCard}
              onSelectCard={onSelectCard}
              theme={settings.theme}
            />
          </div>
        </div>

        {/* Bottom Section: Category Breakdown + Filterable Transactions Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Categories List (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-6">
            <CategoryList
              categories={monthlySummary.categories}
              currencySymbol={settings.currencySymbol}
              selectedCategory={selectedCategory}
              onSelectCategory={onSelectCategory}
              theme={settings.theme}
            />

            {/* Quick Card Insights Box */}
            <div
              className={`rounded-2xl p-4 space-y-3 border ${
                isLight ? 'bg-white border-slate-200/90 shadow-sm' : 'bg-slate-900/60 border-slate-800/70'
              }`}
            >
              <h4
                className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Household Insights</span>
              </h4>

              <div className="space-y-2 text-xs">
                {largestTx && (
                  <div
                    className={`flex items-center justify-between p-2.5 rounded-xl border ${
                      isLight ? 'bg-slate-50 border-slate-200/80 text-slate-800' : 'bg-slate-950/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Largest Charge:</span>
                    <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {largestTx.merchant} ({formatCurrency(largestTx.amount)})
                    </span>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* Right Column: Transactions List (lg:col-span-7) */}
          <div className="lg:col-span-7">
            <TransactionList
              transactions={monthlySummary.transactions}
              currencySymbol={settings.currencySymbol}
              selectedCard={selectedCard}
              selectedCategory={selectedCategory}
              onClearCardFilter={() => onSelectCard(null)}
              onClearCategoryFilter={() => onSelectCategory(null)}
              theme={settings.theme}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

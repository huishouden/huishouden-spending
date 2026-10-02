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
  Info,
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
  /** Live household data from Firestore (signed-in member); hides the sample-data banner. */
  isLiveHousehold?: boolean;
  isSignedIn?: boolean;
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
  isLiveHousehold = false,
  isSignedIn = false,
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
        isLight ? 'bg-cream text-stone-800' : 'bg-forest-900 text-stone-100'
      }`}
    >
      {/* Top Tablet Navigation Header */}
      <header
        className={`sticky top-0 z-30 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between border-b ${
          isLight
            ? 'bg-cream/90 border-stone-200/70'
            : 'bg-forest-900/90 border-forest-800'
        }`}
      >
        {/* Left: Branding & Month Selector */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Huishouden frame: family logo back to the portal, suite name over the app name. */}
          <a href="https://huishouden-piekstra.web.app" className="flex items-center gap-2.5 rounded-xl" aria-label="Huishouden home">
            <img src="/icon.svg" alt="" className="w-10 h-10 rounded-xl" />
            <div>
              <p className={`text-xs font-medium ${isLight ? 'text-stone-600' : 'text-stone-300'}`}>Huishouden</p>
              <h1 className={`text-lg font-bold tracking-tight leading-tight ${isLight ? 'text-forest-700' : 'text-cream'}`}>
                Spending
              </h1>
            </div>
          </a>

          {/* Month Switcher Carousel */}
          <div
            className={`flex items-center rounded-xl p-1 border ${
              isLight ? 'bg-white border-stone-200' : 'bg-forest-800 border-forest-700'
            }`}
          >
            <button
              onClick={goToPrevMonth}
              disabled={!hasPrevMonth}
              className={`p-1.5 rounded-lg transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                isLight ? 'text-stone-600 hover:text-forest-700 hover:bg-stone-100' : 'text-stone-300 hover:text-white hover:bg-forest-700'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span
              className={`text-xs sm:text-sm font-semibold px-3 tabular-nums ${
                isLight ? 'text-forest-700' : 'text-cream'
              }`}
            >
              {monthlySummary.monthName}
            </span>
            <button
              onClick={goToNextMonth}
              disabled={!hasNextMonth}
              className={`p-1.5 rounded-lg transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                isLight ? 'text-stone-600 hover:text-forest-700 hover:bg-stone-100' : 'text-stone-300 hover:text-white hover:bg-forest-700'
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
                  ? 'bg-terracotta-light/40 hover:bg-terracotta-light/70 text-terracotta-dark border-terracotta/40'
                  : 'bg-terracotta/15 hover:bg-terracotta/25 text-terracotta-light border-terracotta/50'
                : isLight
                ? 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
                : 'bg-forest-800 hover:bg-forest-700 text-stone-200 border-forest-700'
            }`}
            title={
              sheetConfig && !hasGoogleAuth
                ? 'Google authorization expired — tap to reconnect and refresh'
                : 'Refresh latest transactions from Google Sheets'
            }
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-forest-600' : ''}`} />
            {sheetConfig && !hasGoogleAuth && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-terracotta ring-2 ring-cream dark:ring-forest-900" />
            )}
          </button>

          {/* Ambient Hub Mode Button (For Pixel Tablet on Dock) */}
          <button
            onClick={onEnterAmbient}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              isLight ? 'bg-forest-700 hover:bg-forest-600 text-white' : 'bg-forest-400 hover:bg-forest-300 text-forest-900'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span className="hidden sm:inline">Dock Mode</span>
            <span className="sm:hidden">Dock</span>
          </button>

          {/* Single Unified Setup & Settings Menu Button */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label="Configuration and Settings Menu"
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition cursor-pointer ${
                isMenuOpen
                  ? isLight
                    ? 'bg-forest-50 border-forest-300 text-forest-700'
                    : 'bg-forest-700 border-forest-600 text-forest-100'
                  : isLight
                  ? 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
                  : 'bg-forest-800 hover:bg-forest-700 text-stone-200 border-forest-700'
              }`}
            >
              <Menu className="w-4 h-4" />
              <span>Menu</span>
              {sheetConfig ? (
                hasGoogleAuth ? (
                  <span className="w-2 h-2 rounded-full bg-forest-500" title="Google Sheet Connected & Synced" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-terracotta animate-pulse" title="Google Authorization Expired (Click to Reconnect)" />
                )
              ) : (
                <span className="w-2 h-2 rounded-full bg-stone-400" title="Using Demo Data" />
              )}
            </button>

            {/* Dropdown Menu Flyout */}
            {isMenuOpen && (
              <>
                {/* Backdrop overlay to close when clicking outside */}
                <div
                  className="fixed inset-0 z-40 bg-black/10 sm:bg-transparent"
                  onClick={() => setIsMenuOpen(false)}
                />

                <div
                  className={`absolute right-0 top-full mt-2 w-80 sm:w-88 rounded-2xl border shadow-2xl z-50 p-4 space-y-4 max-h-[85vh] overflow-y-auto animate-fadeIn ${
                    isLight
                      ? 'bg-white border-stone-200 text-stone-800 shadow-stone-900/10'
                      : 'bg-forest-800 border-forest-700 text-stone-100 shadow-black/40'
                  }`}
                >
                  {/* Menu Title Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-forest-700">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-forest-600 dark:text-forest-300" />
                      <h3 className="font-bold text-xs uppercase tracking-wider text-stone-600 dark:text-stone-300">
                        Configuration &amp; Setup
                      </h3>
                    </div>
                    <button
                      onClick={() => setIsMenuOpen(false)}
                      className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-forest-700 text-stone-500 dark:text-stone-300 hover:text-stone-700 dark:hover:text-stone-200 transition"
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
                            ? 'bg-forest-50/80 border-forest-200'
                            : 'bg-forest-900/50 border-forest-700'
                          : isLight
                          ? 'bg-terracotta-light/50 border-terracotta/40'
                          : 'bg-terracotta/15 border-terracotta/50'
                        : isLight
                        ? 'bg-stone-50 border-stone-200'
                        : 'bg-forest-900/50 border-forest-700'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            sheetConfig
                              ? hasGoogleAuth
                                ? 'bg-forest-500'
                                : 'bg-terracotta animate-pulse'
                              : 'bg-stone-400'
                          }`}
                        />
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            sheetConfig
                              ? hasGoogleAuth
                                ? 'text-forest-700 dark:text-forest-300'
                                : 'text-terracotta-dark dark:text-terracotta-light'
                              : 'text-stone-600 dark:text-stone-400'
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
                              ? 'bg-white hover:bg-forest-50 text-forest-700 border border-forest-200'
                              : 'bg-forest-900 hover:bg-forest-700 text-forest-100 border border-forest-600'
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
                          className="px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 bg-terracotta-dark hover:bg-terracotta text-white"
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
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 bg-forest-700 hover:bg-forest-600 text-white dark:bg-forest-400 dark:hover:bg-forest-300 dark:text-forest-900"
                      >
                        Connect Sheet
                      </button>
                    )}
                  </div>

                  {/* Section 1: Spreadsheet & Card Sync */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 px-2">
                      Card Sync &amp; Data
                    </span>

                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenSheetSync();
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl transition cursor-pointer ${
                        isLight ? 'hover:bg-stone-100' : 'hover:bg-forest-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-forest-50 text-forest-700 dark:bg-forest-700 dark:text-forest-200 flex items-center justify-center shrink-0">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-semibold">Google Sheet Sync</p>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400">Manage spreadsheet ID &amp; card tabs</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-stone-400 dark:text-stone-500" />
                    </button>

                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenSheetSync();
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl transition cursor-pointer ${
                        isLight ? 'hover:bg-stone-100' : 'hover:bg-forest-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-forest-50 text-forest-700 dark:bg-forest-700 dark:text-forest-200 flex items-center justify-center shrink-0">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold">Import Chase CSVs</p>
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-forest-50 text-forest-700 dark:bg-forest-700 dark:text-forest-100 font-semibold">New</span>
                          </div>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400">Clean older data &amp; auto-filter payments</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-stone-400 dark:text-stone-500" />
                    </button>

                    {onOpenSheetGuide && (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenSheetGuide('gmail_sync');
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl transition cursor-pointer ${
                          isLight ? 'hover:bg-stone-100' : 'hover:bg-forest-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-terracotta-light/60 text-terracotta-dark dark:bg-terracotta/20 dark:text-terracotta-light flex items-center justify-center shrink-0">
                            <Zap className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-semibold">Automated Gmail Sync</p>
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-terracotta-light text-terracotta-dark dark:bg-terracotta/25 dark:text-terracotta-light font-semibold">Free</span>
                            </div>
                            <p className="text-[11px] text-stone-500 dark:text-stone-400">15-min background script for Chase &amp; Robinhood</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-stone-400 dark:text-stone-500" />
                      </button>
                    )}

                    {onOpenSheetGuide && (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenSheetGuide('quickstart');
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl transition cursor-pointer ${
                          isLight ? 'hover:bg-stone-100' : 'hover:bg-forest-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-600 dark:bg-forest-700 dark:text-stone-200 flex items-center justify-center shrink-0">
                            <HelpCircle className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-semibold">Spreadsheet Columns &amp; Guide</p>
                            <p className="text-[11px] text-stone-500 dark:text-stone-400">Templates, headers, and format tips</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-stone-400 dark:text-stone-500" />
                      </button>
                    )}
                  </div>

                  {/* Section 2: Tablet & Display Options */}
                  <div className="space-y-1 pt-1 border-t border-stone-200 dark:border-forest-700">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 px-2">
                      Tablet &amp; Display
                    </span>

                    {onOpenPixelGuide && (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenPixelGuide();
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl transition cursor-pointer ${
                          isLight ? 'hover:bg-stone-100' : 'hover:bg-forest-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-forest-50 text-forest-700 dark:bg-forest-700 dark:text-forest-200 flex items-center justify-center shrink-0">
                            <Tablet className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-semibold">Pixel Tablet Setup &amp; PWA</p>
                            <p className="text-[11px] text-stone-500 dark:text-stone-400">Kiosk instructions &amp; Hub mode</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-stone-400 dark:text-stone-500" />
                      </button>
                    )}

                    {/* Fullscreen Kiosk toggle */}
                    <button
                      onClick={() => {
                        toggleFullscreen();
                        setIsMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl transition cursor-pointer ${
                        isLight ? 'hover:bg-stone-100' : 'hover:bg-forest-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-600 dark:bg-forest-700 dark:text-stone-200 flex items-center justify-center shrink-0">
                          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-semibold">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Kiosk Mode'}</p>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400">Hides browser address bar on tablet</p>
                        </div>
                      </div>
                      <span className="text-[11px] text-stone-500 dark:text-stone-400 font-mono">{isFullscreen ? 'Active' : 'Off'}</span>
                    </button>

                    {/* Theme switcher */}
                    <button
                      onClick={() => {
                        onToggleTheme();
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl transition cursor-pointer ${
                        isLight ? 'hover:bg-stone-100' : 'hover:bg-forest-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-forest-700 flex items-center justify-center shrink-0">
                          {isLight ? <Moon className="w-4 h-4 text-forest-700 dark:text-forest-300" /> : <Sun className="w-4 h-4 text-forest-200" />}
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-semibold">Appearance</p>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400">{isLight ? 'Light theme active' : 'Dark theme active'}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-forest-700 dark:text-forest-300">
                        {isLight ? 'Dark' : 'Light'}
                      </span>
                    </button>

                    {/* Privacy mode toggle */}
                    <button
                      onClick={() => {
                        onTogglePrivacy();
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl transition cursor-pointer ${
                        isLight ? 'hover:bg-stone-100' : 'hover:bg-forest-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-forest-700 flex items-center justify-center shrink-0">
                          {settings.showPrivacyBlur ? <EyeOff className="w-4 h-4 text-terracotta-dark dark:text-terracotta-light" /> : <Eye className="w-4 h-4 text-stone-600 dark:text-stone-300" />}
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-semibold">Privacy Blur</p>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400">
                            {settings.showPrivacyBlur ? 'Dollar amounts are blurred' : 'Dollar amounts are visible'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-forest-700 dark:text-forest-300">
                        {settings.showPrivacyBlur ? 'Unhide' : 'Hide'}
                      </span>
                    </button>
                  </div>

                  {/* Section 3: Household Budget & Preferences */}
                  <div className="pt-2 border-t border-stone-200 dark:border-forest-700">
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenSettings();
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl transition cursor-pointer ${
                        isLight ? 'hover:bg-stone-100' : 'hover:bg-forest-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-forest-50 text-forest-700 dark:bg-forest-700 dark:text-forest-200 flex items-center justify-center shrink-0">
                          <Sliders className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-semibold">Budget &amp; Filter Settings</p>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400">Budget, currency symbol &amp; exclusions</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-stone-400 dark:text-stone-500" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-10 space-y-6 lg:space-y-8 max-w-7xl mx-auto w-full">
        {/* Sample-data banner: shown until this device has live household data or a connected Sheet. */}
        {!sheetConfig && !isLiveHousehold && (
          <div
            className={`p-5 sm:p-6 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              isLight ? 'bg-white border-stone-200 text-stone-800 shadow-sm' : 'bg-forest-800 border-forest-700 text-stone-100'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-terracotta-light text-terracotta-dark flex items-center justify-center shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <div className={`text-sm sm:text-base font-semibold flex items-center gap-2 ${isLight ? 'text-forest-700' : 'text-cream'}`}>
                  <span>Showing sample data</span>
                </div>
                <p className={`text-xs mt-0.5 ${isLight ? 'text-stone-600' : 'text-stone-300'}`}>
                  {isSignedIn
                    ? "You're signed in but not in a household yet. Ask a member to invite you in Huishouden, or connect a Google Sheet."
                    : 'Sign in with the Google account your household uses to see your card spending.'}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
              {!isSignedIn && (
                <button
                  onClick={onReconnectGoogle}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium flex ${isLight ? 'bg-forest-700 hover:bg-forest-600 text-white' : 'bg-forest-400 hover:bg-forest-300 text-forest-900'} items-center justify-center gap-2 transition cursor-pointer`}
                >
                  <span>Sign in with Google</span>
                </button>
              )}
              <button
                onClick={onOpenSheetSync}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition cursor-pointer ${isLight ? 'text-stone-700 hover:bg-stone-100' : 'text-stone-200 hover:bg-forest-700'}`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Connect a Google Sheet</span>
              </button>
            </div>
          </div>
        )}
        {/* Tablet & Sheet Quick Setup Bar */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 transition-colors ${
            isLight
              ? 'bg-white border-stone-200/80 shadow-sm shadow-stone-900/5 text-stone-800'
              : 'bg-forest-800 border-forest-700/60 text-stone-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-forest-50 text-forest-700 dark:bg-forest-700 dark:text-forest-100 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className={`text-sm font-semibold flex items-center gap-1.5 ${isLight ? 'text-forest-700' : 'text-cream'}`}>
                <span>Pixel Tablet & Google Drive Setup Guides</span>
                <span className="px-2 py-0.5 rounded-full bg-forest-50 text-forest-700 dark:bg-forest-700 dark:text-forest-100 text-[10px] font-semibold">Ready</span>
              </div>
              <p className={`text-xs ${isLight ? 'text-stone-600' : 'text-stone-300'}`}>
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
                className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                  isLight
                    ? 'bg-white hover:bg-forest-50 text-forest-700 border-stone-200'
                    : 'bg-forest-900/50 hover:bg-forest-700 text-forest-200 border-forest-700'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
                <span>Pixel Tablet Guide</span>
              </button>
            )}

            {onOpenSheetGuide && (
              <button
                onClick={() => onOpenSheetGuide('quickstart')}
                className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                  isLight
                    ? 'bg-white hover:bg-forest-50 text-forest-700 border-stone-200'
                    : 'bg-forest-900/50 hover:bg-forest-700 text-forest-200 border-forest-700'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Google Sheet Guide</span>
              </button>
            )}

            {isInstallable && !isInstalled && (
              <button
                onClick={install}
                className="px-3 py-2 rounded-xl bg-forest-700 hover:bg-forest-600 text-white dark:bg-forest-400 dark:hover:bg-forest-300 dark:text-forest-900 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install App</span>
              </button>
            )}
          </div>
        </div>

        {/* Top KPI Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Total Card Spend */}
          <div
            className={`rounded-2xl p-5 sm:p-6 relative overflow-hidden transition-all border ${
              isLight
                ? 'bg-white border-stone-200/80 shadow-sm shadow-stone-900/5'
                : 'bg-forest-800 border-forest-700/60'
            }`}
          >
            <span className={`text-sm font-medium ${isLight ? 'text-stone-600' : 'text-stone-300'}`}>
              Spending this month
            </span>
            <div
              className={`text-2xl sm:text-3xl font-bold mt-2 tracking-tight tabular-nums ${
                isLight ? 'text-forest-700' : 'text-cream'
              }`}
            >
              {formatCurrency(monthlySummary.totalSpend)}
            </div>
            {prevSpend ? (
              <div className="flex items-center gap-1 text-xs mt-1.5 font-medium">
                {spendDiff > 0 ? (
                  <span className="text-terracotta-dark dark:text-terracotta-light flex items-center">
                    <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                    +{Math.round(spendPercentDiff)}% vs last mo
                  </span>
                ) : (
                  <span className="text-forest-700 dark:text-forest-300 flex items-center">
                    <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                    {Math.round(spendPercentDiff)}% vs last mo
                  </span>
                )}
              </div>
            ) : (
              <div className={`text-xs mt-1.5 ${isLight ? 'text-stone-500' : 'text-stone-400'}`}>
                Based on card sync
              </div>
            )}
          </div>

          {/* Card 2: Daily Velocity */}
          <div
            className={`rounded-2xl p-5 sm:p-6 relative overflow-hidden transition-all border ${
              isLight
                ? 'bg-white border-stone-200/80 shadow-sm shadow-stone-900/5'
                : 'bg-forest-800 border-forest-700/60'
            }`}
          >
            <span className={`text-sm font-medium ${isLight ? 'text-stone-600' : 'text-stone-300'}`}>
              Daily Card Velocity
            </span>
            <div
              className={`text-2xl sm:text-3xl font-bold mt-2 tracking-tight tabular-nums ${
                isLight ? 'text-forest-700' : 'text-cream'
              }`}
            >
              {formatShortCurrency(monthlySummary.dailyAverage)}
              <span className={`text-xs font-normal ml-1 ${isLight ? 'text-stone-500' : 'text-stone-300'}`}>
                /day
              </span>
            </div>
            <div className={`text-xs mt-1.5 ${isLight ? 'text-stone-500' : 'text-stone-300'}`}>
              Projected end: {formatShortCurrency(monthlySummary.projectedMonthEnd)}
            </div>
          </div>

          {/* Card 3: Total Transactions */}
          <div
            className={`rounded-2xl p-5 sm:p-6 relative overflow-hidden transition-all border ${
              isLight
                ? 'bg-white border-stone-200/80 shadow-sm shadow-stone-900/5'
                : 'bg-forest-800 border-forest-700/60'
            }`}
          >
            <span className={`text-sm font-medium ${isLight ? 'text-stone-600' : 'text-stone-300'}`}>
              Total Charges
            </span>
            <div
              className={`text-2xl sm:text-3xl font-bold mt-2 tracking-tight tabular-nums ${
                isLight ? 'text-forest-700' : 'text-cream'
              }`}
            >
              {monthlySummary.transactionCount}
            </div>
            <div className={`text-xs mt-1.5 ${isLight ? 'text-stone-500' : 'text-stone-300'}`}>
              Excludes mortgage & debits
            </div>
          </div>

          {/* Card 4: Top Category or Rewards */}
          <div
            className={`rounded-2xl p-5 sm:p-6 relative overflow-hidden transition-all border ${
              isLight
                ? 'bg-white border-stone-200/80 shadow-sm shadow-stone-900/5'
                : 'bg-forest-800 border-forest-700/60'
            }`}
          >
            <span className={`text-sm font-medium ${isLight ? 'text-stone-600' : 'text-stone-300'}`}>
              Top Category
            </span>
            <div
              className={`text-xl sm:text-2xl font-bold mt-2 tracking-tight truncate ${
                isLight ? 'text-forest-700' : 'text-cream'
              }`}
            >
              {monthlySummary.categories[0]?.category || 'N/A'}
            </div>
            <div className={`text-xs mt-1.5 ${isLight ? 'text-stone-500' : 'text-stone-300'}`}>
              {monthlySummary.categories[0]
                ? `${formatShortCurrency(monthlySummary.categories[0].total)} (${monthlySummary.categories[0].percentage.toFixed(0)}%)`
                : 'No charges'}
            </div>
          </div>
        </div>

        {/* Middle Section: Budget Pacing and Active Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Column: Categories List (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-6 lg:space-y-8">
            <CategoryList
              categories={monthlySummary.categories}
              currencySymbol={settings.currencySymbol}
              selectedCategory={selectedCategory}
              onSelectCategory={onSelectCategory}
              theme={settings.theme}
            />

            {/* Quick Card Insights Box */}
            <div
              className={`rounded-2xl p-5 sm:p-6 space-y-3 border ${
                isLight ? 'bg-white border-stone-200/80 shadow-sm shadow-stone-900/5' : 'bg-forest-800 border-forest-700/60'
              }`}
            >
              <h4
                className={`text-base font-semibold flex items-center gap-2 ${
                  isLight ? 'text-forest-700' : 'text-cream'
                }`}
              >
                <Sparkles className="w-4 h-4 text-terracotta" />
                <span>Household Insights</span>
              </h4>

              <div className="space-y-2 text-xs">
                {largestTx && (
                  <div
                    className={`flex items-center justify-between p-2.5 rounded-xl border ${
                      isLight ? 'bg-stone-50 border-stone-200/70 text-stone-800' : 'bg-forest-900/50 border-forest-700/60 text-stone-200'
                    }`}
                  >
                    <span className={isLight ? 'text-stone-600' : 'text-stone-300'}>Largest Charge:</span>
                    <span className={`font-semibold ${isLight ? 'text-stone-800' : 'text-cream'}`}>
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

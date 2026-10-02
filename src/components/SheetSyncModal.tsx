import React, { useState, useEffect } from 'react';
import { SheetConfig, ColumnMapping } from '../types';
import {
  listDriveSpreadsheets,
  getSpreadsheetDetails,
  getSpreadsheetRows,
  getSpreadsheetDetailsUniversal,
  getSpreadsheetRowsUniversal,
  autoDetectColumnMapping,
  DriveFileItem,
  SpreadsheetDetails,
  extractSpreadsheetId,
} from '../services/sheets';
import { googleSignIn, logout, getAccessToken } from '../services/auth';
import { GoogleSignInButton } from './GoogleSignInButton';
import { ChaseCsvImporter } from './ChaseCsvImporter';
import { CardTransaction } from '../types';
import { User } from 'firebase/auth';
import {
  X,
  FileSpreadsheet,
  Search,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Table,
  Sparkles,
  ArrowRight,
  LogOut,
  RefreshCw,
  Zap,
  Upload,
} from 'lucide-react';

interface SheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  currentConfig: SheetConfig | null;
  onSaveConfig: (config: SheetConfig) => void;
  onDisconnectConfig: () => void;
  theme?: 'light' | 'dark';
  onOpenFullGuide?: (tab?: 'quickstart' | 'gmail_sync' | 'columns' | 'chase_robinhood' | 'template') => void;
  onImportTransactions?: (transactions: CardTransaction[]) => void;
}

export const SheetSyncModal: React.FC<SheetSyncModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentConfig,
  onSaveConfig,
  onDisconnectConfig,
  theme = 'light',
  onOpenFullGuide,
  onImportTransactions,
}) => {
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState<'browse' | 'manual' | 'chase' | 'guide'>('browse');
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [isSearchingFiles, setIsSearchingFiles] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSheetId, setSelectedSheetId] = useState(currentConfig?.spreadsheetId || '');
  const [manualUrlOrId, setManualUrlOrId] = useState(currentConfig?.spreadsheetId || '');

  const [spreadsheetMeta, setSpreadsheetMeta] = useState<SpreadsheetDetails | null>(null);
  const [selectedTabTitle, setSelectedTabTitle] = useState(currentConfig?.sheetName || '');
  const [isLoadingMeta, setIsLoadingMeta] = useState(false);

  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>(
    currentConfig?.mapping || {
      dateCol: '',
      merchantCol: '',
      amountCol: '',
      categoryCol: '',
      cardCol: '',
      notesCol: '',
    }
  );
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [hasActiveToken, setHasActiveToken] = useState(false);

  // Check auth and load drive spreadsheets when opened
  useEffect(() => {
    if (isOpen) {
      getAccessToken().then((token) => {
        const active = Boolean(token);
        setHasActiveToken(active);
        if (token) {
          loadDriveFiles('', token);
        }
      });
    }
  }, [isOpen, currentUser]);

  const loadDriveFiles = async (query = '', tokenToUse?: string) => {
    try {
      setIsSearchingFiles(true);
      setErrorMsg(null);
      const token = tokenToUse || (await getAccessToken());
      if (!token) {
        setHasActiveToken(false);
        setErrorMsg('Please tap "Authorize Google Drive" to grant read access to your private spreadsheets.');
        return;
      }
      setHasActiveToken(true);
      const files = await listDriveSpreadsheets(token, query);
      setDriveFiles(files);
      if (files.length === 0) {
        setErrorMsg('No Google Sheets found. If your spreadsheet is in a subfolder or shared drive, search its title above or use the "Enter Sheet Link" tab.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to search Drive files';
      setErrorMsg(`${msg}. You can also paste your private Google Sheet link in the "Enter Sheet Link" tab.`);
    } finally {
      setIsSearchingFiles(false);
    }
  };

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      setErrorMsg(null);
      const res = await googleSignIn();
      if (res?.accessToken) {
        setHasActiveToken(true);
        await loadDriveFiles('', res.accessToken);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google Sign-In failed';
      setErrorMsg(msg);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setHasActiveToken(false);
    setDriveFiles([]);
  };

  const handleSelectSpreadsheet = async (sheetId: string, title?: string) => {
    try {
      setSelectedSheetId(sheetId);
      setIsLoadingMeta(true);
      setErrorMsg(null);
      const token = await getAccessToken();

      const meta = await getSpreadsheetDetailsUniversal(token, sheetId);
      if (title) meta.title = title;
      setSpreadsheetMeta(meta);

      const firstTab = meta.sheets[0]?.title || 'Sheet1';
      setSelectedTabTitle(firstTab);

      // Fetch first few rows to auto-detect columns
      const rows = await getSpreadsheetRowsUniversal(token, sheetId, firstTab, 'A1:Z15');
      setPreviewRows(rows);
      if (rows.length > 0) {
        const headers = rows[0].map((h) => (h || '').trim());
        setDetectedHeaders(headers);
        const autoMap = autoDetectColumnMapping(headers);
        setColumnMapping(autoMap);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load spreadsheet details';
      setErrorMsg(msg);
    } finally {
      setIsLoadingMeta(false);
    }
  };

  const handleTabChange = async (newTab: string) => {
    setSelectedTabTitle(newTab);
    if (!selectedSheetId) return;
    try {
      setIsLoadingMeta(true);
      const token = await getAccessToken();
      const rows = await getSpreadsheetRowsUniversal(token, selectedSheetId, newTab, 'A1:Z15');
      setPreviewRows(rows);
      if (rows.length > 0) {
        const headers = rows[0].map((h) => (h || '').trim());
        setDetectedHeaders(headers);
        const autoMap = autoDetectColumnMapping(headers);
        setColumnMapping(autoMap);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to inspect tab';
      setErrorMsg(msg);
    } finally {
      setIsLoadingMeta(false);
    }
  };

  const handleSaveAndSync = () => {
    if (!selectedSheetId) {
      setErrorMsg('Please select or specify a Google Sheet.');
      return;
    }
    if (!selectedTabTitle) {
      setErrorMsg('Please select a sheet tab.');
      return;
    }

    const config: SheetConfig = {
      spreadsheetId: selectedSheetId,
      spreadsheetTitle: spreadsheetMeta?.title || 'Huishouden Spending',
      sheetName: selectedTabTitle,
      lastSyncedAt: new Date().toISOString(),
      mapping: columnMapping,
      autoSyncIntervalMinutes: currentConfig?.autoSyncIntervalMinutes || 15,
    };

    onSaveConfig(config);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fadeIn">
      <div
        className={`border rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors ${
          isLight ? 'bg-white border-stone-200 text-stone-900' : 'bg-forest-800 border-forest-700 text-stone-100'
        }`}
      >
        {/* Header */}
        <div className={`p-6 border-b flex items-center justify-between ${isLight ? 'border-stone-200' : 'border-forest-700'}`}>
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${
                isLight ? 'bg-forest-50 border-forest-200 text-forest-700' : 'bg-forest-500/20 border-forest-500/30 text-forest-300'
              }`}
            >
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-lg font-bold tracking-tight ${isLight ? 'text-stone-900' : 'text-white'}`}>
                Connect Google Sheet
              </h2>
              <p className={`text-xs ${isLight ? 'text-stone-500' : 'text-stone-400'}`}>
                Sync your card transactions
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition cursor-pointer ${
              isLight ? 'text-stone-500 hover:text-stone-700 hover:bg-stone-100' : 'text-stone-400 hover:text-white hover:bg-forest-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth status bar */}
        <div
          className={`px-6 py-3 border-b flex items-center justify-between text-xs ${
            isLight ? 'bg-stone-50 border-stone-200' : 'bg-forest-800/60 border-forest-700'
          }`}
        >
          {currentUser && hasActiveToken ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-forest-500" />
              <span className={isLight ? 'text-stone-700' : 'text-stone-300'}>
                Authorized as <strong className={isLight ? 'text-stone-900' : 'text-white'}>{currentUser.email || currentUser.displayName}</strong>
              </span>
            </div>
          ) : (
            <div className={`flex items-center gap-2 ${isLight ? 'text-terracotta-dark font-medium' : 'text-terracotta-light'}`}>
              <AlertCircle className="w-4 h-4 text-terracotta-dark dark:text-terracotta-light shrink-0" />
              <span>
                {currentUser
                  ? `Signed in as ${currentUser.email || 'user'} — Drive authorization needed`
                  : 'Authorize Google account to read your private Drive spreadsheets'}
              </span>
            </div>
          )}

          {currentUser && hasActiveToken ? (
            <button
              onClick={handleLogout}
              className="text-xs text-stone-500 dark:text-stone-400 hover:text-terracotta-dark flex items-center gap-1 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          ) : (
            <GoogleSignInButton
              onClick={handleSignIn}
              isLoading={isSigningIn}
              label={currentUser ? "Authorize Drive Access" : "Sign in with Google"}
              className="!py-1.5 !px-3 !text-xs !min-h-[32px] !rounded-lg"
            />
          )}
        </div>

        {/* Modal Navigation Tabs */}
        <div
          className={`flex border-b px-6 pt-3 gap-6 text-sm ${
            isLight ? 'bg-stone-50/80 border-stone-200' : 'bg-forest-800/50 border-forest-700'
          }`}
        >
          <button
            onClick={() => setActiveTab('browse')}
            className={`pb-3 font-semibold transition cursor-pointer relative ${
              activeTab === 'browse'
                ? isLight
                  ? 'text-forest-700 border-b-2 border-forest-700'
                  : 'text-forest-300 border-b-2 border-forest-600'
                : isLight
                ? 'text-stone-500 hover:text-stone-900'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Browse Google Drive
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`pb-3 font-semibold transition cursor-pointer relative ${
              activeTab === 'manual'
                ? isLight
                  ? 'text-forest-700 border-b-2 border-forest-700'
                  : 'text-forest-300 border-b-2 border-forest-600'
                : isLight
                ? 'text-stone-500 hover:text-stone-900'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Enter Sheet Link
          </button>
          <button
            onClick={() => setActiveTab('chase')}
            className={`pb-3 font-semibold transition cursor-pointer relative flex items-center gap-1.5 ${
              activeTab === 'chase'
                ? isLight
                  ? 'text-forest-700 border-b-2 border-forest-700'
                  : 'text-forest-300 border-b-2 border-forest-600'
                : isLight
                ? 'text-stone-500 hover:text-stone-900'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Chase CSVs</span>
            <span className="px-1.5 py-0.5 rounded-full bg-forest-600/20 text-forest-700 dark:text-forest-300 text-[10px] font-bold">
              New
            </span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-3 font-semibold transition cursor-pointer relative ${
              activeTab === 'guide'
                ? isLight
                  ? 'text-forest-700 border-b-2 border-forest-700'
                  : 'text-forest-300 border-b-2 border-forest-600'
                : isLight
                ? 'text-stone-500 hover:text-stone-900'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Card Sync Guide & Template
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-terracotta/10 border border-terracotta/30 text-terracotta-dark dark:text-terracotta-light text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: BROWSE DRIVE */}
          {activeTab === 'browse' && (
            <div className="space-y-4">
              {!hasActiveToken ? (
                <div className="py-10 text-center space-y-4 border border-dashed border-stone-200 dark:border-forest-700/60 rounded-2xl p-6 bg-stone-50 dark:bg-forest-900/20">
                  <div className="w-12 h-12 rounded-2xl bg-forest-600/10 text-forest-700 dark:text-forest-300 flex items-center justify-center mx-auto">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-stone-900 dark:text-white">Authorize Google Drive Access</h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto mt-1">
                      Connect the Google account that owns the spreadsheet to securely browse and select your private credit card spending spreadsheet directly from your Google Drive.
                    </p>
                  </div>
                  <GoogleSignInButton
                    onClick={handleSignIn}
                    isLoading={isSigningIn}
                    label="Authorize Google Drive"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Search box */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 dark:text-stone-400" />
                      <input
                        type="text"
                        placeholder="Search spreadsheets in Google Drive..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && loadDriveFiles(searchQuery)}
                        className="w-full bg-stone-50 dark:bg-forest-900 border border-stone-200 dark:border-forest-800 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-900 dark:text-white placeholder-stone-500 focus:outline-hidden focus:ring-1 focus:ring-forest-600"
                      />
                    </div>
                    <button
                      onClick={() => loadDriveFiles(searchQuery)}
                      disabled={isSearchingFiles}
                      className="px-3 py-2 bg-white dark:bg-forest-800 hover:bg-forest-700 text-stone-600 dark:text-stone-300 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSearchingFiles ? 'animate-spin' : ''}`} />
                      <span>Search</span>
                    </button>
                  </div>

                  {/* Drive File Picker List */}
                  <div className="border border-stone-200 dark:border-forest-800 rounded-2xl overflow-hidden divide-y divide-stone-100 dark:divide-forest-800/80 max-h-56 overflow-y-auto">
                    {driveFiles.map((file) => {
                      const isSelected = selectedSheetId === file.id;
                      return (
                        <div
                          key={file.id}
                          onClick={() => handleSelectSpreadsheet(file.id, file.name)}
                          className={`p-3 flex items-center justify-between hover:bg-forest-800/50 cursor-pointer transition ${
                            isSelected ? 'bg-stone-50 dark:bg-forest-900/40 border-l-4 border-l-forest-600' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <FileSpreadsheet className="w-4 h-4 text-forest-700 dark:text-forest-300 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-stone-900 dark:text-white truncate">
                                {file.name}
                              </div>
                              <div className="text-[11px] text-stone-500">
                                {file.modifiedTime ? `Modified ${new Date(file.modifiedTime).toLocaleDateString()}` : 'Google Sheet'}
                              </div>
                            </div>
                          </div>

                          {isSelected ? (
                            <span className="text-xs text-forest-700 dark:text-forest-300 font-semibold flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Selected
                            </span>
                          ) : (
                            <span className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white">Select</span>
                          )}
                        </div>
                      );
                    })}

                    {driveFiles.length === 0 && !isSearchingFiles && (
                      <div className="py-8 text-center text-xs text-stone-500">
                        No spreadsheets found. Try a different query or switch to &quot;Enter Sheet Link&quot;.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MANUAL URL / ID */}
          {activeTab === 'manual' && (
            <div className="space-y-4">
              {!hasActiveToken && (
                <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-forest-900/30 border border-forest-200 dark:border-forest-600/30 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-forest-700 dark:text-forest-200">
                    <AlertCircle className="w-4 h-4 shrink-0 text-forest-700 dark:text-forest-300" />
                    <span>Authorize your Google account to grant secure access to your private spreadsheet.</span>
                  </div>
                  <GoogleSignInButton
                    onClick={handleSignIn}
                    isLoading={isSigningIn}
                    label="Authorize"
                    className="!py-1 !px-2.5 !text-xs !min-h-[28px] !rounded-lg shrink-0"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                  Private Google Sheet URL or Spreadsheet ID
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XR..."
                    value={manualUrlOrId}
                    onChange={(e) => setManualUrlOrId(e.target.value)}
                    className="flex-1 bg-stone-50 dark:bg-forest-900 border border-stone-200 dark:border-forest-800 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white placeholder-stone-500 focus:outline-hidden focus:ring-1 focus:ring-forest-600"
                  />
                  <button
                    onClick={async () => {
                      const cleanId = extractSpreadsheetId(manualUrlOrId);
                      if (!cleanId) return;
                      if (!hasActiveToken) {
                        try {
                          setIsSigningIn(true);
                          const res = await googleSignIn();
                          if (res?.accessToken) {
                            setHasActiveToken(true);
                            await handleSelectSpreadsheet(cleanId);
                          }
                        } catch (err: unknown) {
                          const msg = err instanceof Error ? err.message : 'Google authorization failed';
                          setErrorMsg(msg);
                        } finally {
                          setIsSigningIn(false);
                        }
                      } else {
                        handleSelectSpreadsheet(cleanId);
                      }
                    }}
                    disabled={isLoadingMeta || !manualUrlOrId.trim()}
                    className="px-4 py-2 bg-forest-700 hover:bg-forest-600 text-white text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50"
                  >
                    {isLoadingMeta ? 'Loading...' : 'Load Sheet'}
                  </button>
                </div>
                <div className="mt-3 p-3 rounded-xl bg-stone-50 dark:bg-forest-900/60 border border-stone-200 dark:border-forest-800 text-stone-600 dark:text-stone-300 text-xs flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-forest-500/20 text-forest-700 dark:text-forest-300 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-stone-900 dark:text-white">Strict Privacy &amp; Security Guaranteed</span>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                      Your spreadsheet is kept completely private and restricted to your Google account. Data is fetched directly from Google Sheets API using your secure credentials and is never exposed or made public.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: IMPORT CHASE CSVS */}
          {activeTab === 'chase' && (
            <ChaseCsvImporter
              theme={theme}
              onImportToDashboard={onImportTransactions}
            />
          )}

          {/* TAB: CARD SYNC GUIDE & STARTER TEMPLATE */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-forest-900/30 border border-forest-200 dark:border-forest-600/20 space-y-2">
                <div className="flex items-center gap-2 text-forest-700 dark:text-forest-300 font-semibold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>How to sync Chase & Robinhood to Google Sheets</span>
                </div>
                <p>
                  You can sync transactions from Chase and Robinhood into your Google Sheet automatically or semi-automatically using several easy options:
                </p>
                <ol className="list-decimal pl-5 space-y-1.5 text-stone-600 dark:text-stone-300 pt-1">
                  <li>
                    <strong className="text-terracotta-dark dark:text-terracotta-light">Free Gmail Auto-Sync (Recommended):</strong> Use our built-in Google Apps Script to automatically catch Chase & Robinhood alert emails and deposit charges directly into your sheet every 15 minutes!
                  </li>
                  <li>
                    <strong>Robinhood CSV / Chase Export:</strong> Download monthly CSV exports from your card issuers and paste them into the sheet.
                  </li>
                  <li>
                    <strong>Tiller Money / Webhooks:</strong> Plugs directly into bank feeds to sync transactions.
                  </li>
                </ol>
              </div>

              {/* Free Gmail Sync Highlight Box */}
              <div className="p-4 rounded-2xl bg-terracotta/10 border border-terracotta/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-terracotta/20 border border-terracotta/30 flex items-center justify-center text-terracotta-dark dark:text-terracotta-light shrink-0">
                    <Zap className="w-5 h-5 fill-terracotta-dark dark:fill-terracotta-light" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-terracotta-dark dark:text-terracotta-light flex items-center gap-1.5">
                      <span>Free Chase &amp; Robinhood Auto-Sync Script</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-terracotta/20 text-terracotta-dark dark:text-terracotta-light font-bold">100% Free</span>
                    </div>
                    <p className="text-[11px] text-stone-600 dark:text-terracotta-light/80 mt-0.5">
                      Runs inside your Google Sheet on a 15-minute background timer without Plaid.
                    </p>
                  </div>
                </div>
                {onOpenFullGuide && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenFullGuide('gmail_sync');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-terracotta hover:bg-terracotta text-stone-950 font-bold text-xs whitespace-nowrap cursor-pointer transition shrink-0 flex items-center gap-1 shadow-sm"
                  >
                    <span>View Script</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-forest-900 border border-stone-200 dark:border-forest-800 space-y-3">
                <div className="font-semibold text-stone-900 dark:text-white flex items-center justify-between">
                  <span>Recommended Google Sheet Column Layout</span>
                  <span className="text-forest-700 dark:text-forest-300 font-normal">Auto-detected</span>
                </div>
                <div className="grid grid-cols-6 gap-2 font-mono text-[11px] text-center">
                  <div className="bg-white dark:bg-forest-800/80 p-2 rounded-lg border border-stone-200 dark:border-forest-700">Date</div>
                  <div className="bg-white dark:bg-forest-800/80 p-2 rounded-lg border border-stone-200 dark:border-forest-700">Description</div>
                  <div className="bg-white dark:bg-forest-800/80 p-2 rounded-lg border border-stone-200 dark:border-forest-700">Amount</div>
                  <div className="bg-white dark:bg-forest-800/80 p-2 rounded-lg border border-stone-200 dark:border-forest-700">Category</div>
                  <div className="bg-white dark:bg-forest-800/80 p-2 rounded-lg border border-stone-200 dark:border-forest-700">Card</div>
                  <div className="bg-white dark:bg-forest-800/80 p-2 rounded-lg border border-stone-200 dark:border-forest-700">Type</div>
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  Note: Any payments labeled as such will automatically be filtered out so only card spending is shown.
                </p>
              </div>

              {onOpenFullGuide && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenFullGuide('quickstart');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-forest-700 hover:bg-forest-600 text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Open Full Step-by-Step Guide &amp; Download Template</span>
                </button>
              )}
            </div>
          )}

          {/* SPREADSHEET CONFIGURATION SECTION (TAB & COLUMN MAPPING) */}
          {selectedSheetId && (
            <div className="pt-4 border-t border-stone-200 dark:border-forest-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                    <Table className="w-4 h-4 text-forest-700 dark:text-forest-300" />
                    <span>Configure &quot;{spreadsheetMeta?.title || selectedSheetId}&quot;</span>
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Select sheet tab and verify column mappings
                  </p>
                </div>

                {/* Tab selector */}
                {spreadsheetMeta && spreadsheetMeta.sheets.length > 0 && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-stone-500 dark:text-stone-400">Tab:</label>
                    <select
                      value={selectedTabTitle}
                      onChange={(e) => handleTabChange(e.target.value)}
                      className="bg-stone-50 dark:bg-forest-900 border border-stone-200 dark:border-forest-800 text-xs text-stone-900 dark:text-white rounded-xl px-2.5 py-1.5 focus:outline-hidden"
                    >
                      {spreadsheetMeta.sheets.map((s) => (
                        <option key={s.title} value={s.title}>
                          {s.title} {s.rowCount ? `(${s.rowCount} rows)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Column Mapping Selectors */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-stone-50 dark:bg-forest-900/60 p-4 rounded-2xl border border-stone-200 dark:border-forest-800">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-300 mb-1">
                    Date Column *
                  </label>
                  <select
                    value={columnMapping.dateCol}
                    onChange={(e) => setColumnMapping({ ...columnMapping, dateCol: e.target.value })}
                    className="w-full bg-stone-50 dark:bg-forest-900 border border-stone-200 dark:border-forest-800 rounded-lg p-1.5 text-xs text-stone-900 dark:text-white"
                  >
                    <option value="">Select column...</option>
                    {detectedHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-300 mb-1">
                    Merchant / Payee *
                  </label>
                  <select
                    value={columnMapping.merchantCol}
                    onChange={(e) =>
                      setColumnMapping({ ...columnMapping, merchantCol: e.target.value })
                    }
                    className="w-full bg-stone-50 dark:bg-forest-900 border border-stone-200 dark:border-forest-800 rounded-lg p-1.5 text-xs text-stone-900 dark:text-white"
                  >
                    <option value="">Select column...</option>
                    {detectedHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-300 mb-1">
                    Amount / Cost *
                  </label>
                  <select
                    value={columnMapping.amountCol}
                    onChange={(e) => setColumnMapping({ ...columnMapping, amountCol: e.target.value })}
                    className="w-full bg-stone-50 dark:bg-forest-900 border border-stone-200 dark:border-forest-800 rounded-lg p-1.5 text-xs text-stone-900 dark:text-white"
                  >
                    <option value="">Select column...</option>
                    {detectedHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-300 mb-1">
                    Category Column *
                  </label>
                  <select
                    value={columnMapping.categoryCol}
                    onChange={(e) =>
                      setColumnMapping({ ...columnMapping, categoryCol: e.target.value })
                    }
                    className="w-full bg-stone-50 dark:bg-forest-900 border border-stone-200 dark:border-forest-800 rounded-lg p-1.5 text-xs text-stone-900 dark:text-white"
                  >
                    <option value="">Select column...</option>
                    {detectedHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-300 mb-1">
                    Card / Account *
                  </label>
                  <select
                    value={columnMapping.cardCol}
                    onChange={(e) => setColumnMapping({ ...columnMapping, cardCol: e.target.value })}
                    className="w-full bg-stone-50 dark:bg-forest-900 border border-stone-200 dark:border-forest-800 rounded-lg p-1.5 text-xs text-stone-900 dark:text-white"
                  >
                    <option value="">Select column...</option>
                    {detectedHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-300 mb-1">
                    Notes / Memo (Opt)
                  </label>
                  <select
                    value={columnMapping.notesCol || ''}
                    onChange={(e) =>
                      setColumnMapping({ ...columnMapping, notesCol: e.target.value || undefined })
                    }
                    className="w-full bg-stone-50 dark:bg-forest-900 border border-stone-200 dark:border-forest-800 rounded-lg p-1.5 text-xs text-stone-900 dark:text-white"
                  >
                    <option value="">None</option>
                    {detectedHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sample Data Preview Table */}
              {previewRows.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">Sheet Preview (First Rows):</div>
                  <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-forest-800">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-stone-50 dark:bg-forest-900 text-stone-500 dark:text-stone-400 uppercase font-mono">
                        <tr>
                          {previewRows[0].map((h, i) => (
                            <th key={i} className="p-2 border-b border-stone-200 dark:border-forest-800 font-medium truncate max-w-[120px]">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-forest-800/60 text-stone-600 dark:text-stone-300">
                        {previewRows.slice(1, 4).map((row, rIdx) => (
                          <tr key={rIdx}>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="p-2 truncate max-w-[120px]">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-stone-200 dark:border-forest-800 bg-stone-50 dark:bg-forest-900/80 flex items-center justify-between">
          <div>
            {currentConfig && (
              <button
                onClick={onDisconnectConfig}
                className="text-xs text-terracotta-dark dark:text-terracotta-light hover:text-terracotta-dark dark:hover:text-terracotta-light transition cursor-pointer"
              >
                Disconnect Current Sheet
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white bg-white dark:bg-forest-800 hover:bg-forest-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndSync}
              disabled={!selectedSheetId || !selectedTabTitle}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-forest-700 hover:bg-forest-600 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1.5"
            >
              <span>Save & Sync Sheet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

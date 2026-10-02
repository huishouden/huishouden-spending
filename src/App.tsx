import { useState, useEffect, useCallback, useMemo } from 'react';
import { User } from 'firebase/auth';
import {
  CardTransaction,
  HouseholdSettings,
  SheetConfig,
} from './types';
import {
  loadSettings,
  saveSettings,
  loadSheetConfig,
  saveSheetConfig,
  loadCachedTransactions,
  saveCachedTransactions,
} from './services/storage';
import { aggregateMonthlySummary, MOCK_CARD_TRANSACTIONS } from './services/mockData';
import { initAuth, getAccessToken, setCachedAccessToken, googleSignIn, googleSignInBasic, logout, auth } from './services/auth';
import { forgetSilentSignIn, signInSilently } from '@huishouden/pwa-kit/auth';
import { findHouseholdId, saveProfile, subscribeTransactions } from './services/firestoreTransactions';
import { getSpreadsheetRowsUniversal, parseSheetRowsToTransactions } from './services/sheets';
import { AmbientDashboard } from './components/AmbientDashboard';
import { InteractiveDashboard } from './components/InteractiveDashboard';
import { SheetSyncModal } from './components/SheetSyncModal';
import { SettingsModal } from './components/SettingsModal';
import { PixelInstallModal } from './components/PixelInstallModal';
import { GoogleSheetGuideModal } from './components/GoogleSheetGuideModal';

// Firestore (mirrored from the Sheet by the Apps Script) is used whenever the signed-in account
// belongs to a household; VITE_DATA_SOURCE=sheets forces the original browser-to-Sheets path.
const FIRESTORE_SOURCE_ENABLED = import.meta.env.VITE_DATA_SOURCE !== 'sheets';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  /** False until Firebase has restored (or ruled out) the saved session. */
  const [authResolved, setAuthResolved] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [hasGoogleAuth, setHasGoogleAuth] = useState(false);
  const [settings, setSettings] = useState<HouseholdSettings>(loadSettings);
  const [sheetConfig, setSheetConfig] = useState<SheetConfig | null>(loadSheetConfig);
  const [transactions, setTransactions] = useState<CardTransaction[]>(loadCachedTransactions);

  const [isAmbientMode, setIsAmbientMode] = useState<boolean>(() => {
    // Default to ambient mode on tablets or if previously preferred
    return window.innerWidth >= 768 && loadSettings().dockModeAutoStart;
  });

  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPixelGuideOpen, setIsPixelGuideOpen] = useState(false);
  const [isSheetGuideOpen, setIsSheetGuideOpen] = useState(false);
  const [sheetGuideTab, setSheetGuideTab] = useState<'quickstart' | 'gmail_sync' | 'columns' | 'chase_robinhood' | 'template'>('quickstart');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncStatusToast, setSyncStatusToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleOpenSheetGuide = (tab: 'quickstart' | 'gmail_sync' | 'columns' | 'chase_robinhood' | 'template' = 'quickstart') => {
    setSheetGuideTab(tab);
    setIsSheetGuideOpen(true);
  };

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAuthResolved(true);
        if (token) {
          setCachedAccessToken(token);
          setHasGoogleAuth(true);
        } else {
          setHasGoogleAuth(false);
        }
      },
      () => {
        setCurrentUser(null);
        setAuthResolved(true);
        setCachedAccessToken(null);
        setHasGoogleAuth(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Signs in without a click when the browser is already signed in to Google and has used the app.
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (FIRESTORE_SOURCE_ENABLED && clientId) void signInSilently(auth, clientId);
  }, []);

  // A signed-in household member gets live data straight away; Firebase keeps the session on this
  // device, so the tablet opens to live data after one sign-in.
  useEffect(() => {
    if (!FIRESTORE_SOURCE_ENABLED || !currentUser?.email || householdId) return;
    let cancelled = false;
    findHouseholdId(currentUser.email)
      .then((id) => !cancelled && id && setHouseholdId(id))
      .catch((err) => console.warn('Household lookup failed; staying on the Sheets source.', err));
    return () => {
      cancelled = true;
    };
  }, [currentUser, householdId]);

  // Live data from Firestore: no Google API token, so it keeps updating without re-sign-in.
  useEffect(() => {
    const email = currentUser?.email;
    if (!FIRESTORE_SOURCE_ENABLED || !email) {
      setHouseholdId(null);
      return;
    }
    let cancelled = false;
    findHouseholdId(email).then((id) => {
      if (!cancelled) setHouseholdId(id);
    });
    return () => {
      cancelled = true;
    };
  }, [currentUser?.email]);

  useEffect(() => {
    if (!householdId) return;
    return subscribeTransactions(
      householdId,
      settings.ignoredKeywords,
      (txs) => {
        setTransactions(txs);
        saveCachedTransactions(txs);
      },
      (err) => {
        console.warn('Firestore subscription failed; falling back to the Sheets source.', err);
        setHouseholdId(null);
      },
    );
  }, [householdId, settings.ignoredKeywords]);

  // Members' names and photos come from their own sign-ins (shown in the portal and the other apps).
  useEffect(() => {
    if (householdId && currentUser) saveProfile(householdId, currentUser).catch(() => {});
  }, [householdId, currentUser]);

  // The app bar's Sign in: plain Google sign-in (no Sheets scopes); the household lookup follows.
  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await googleSignInBasic();
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        setSyncStatusToast({ message: "Couldn't sign in. Try again.", type: 'error' });
        setTimeout(() => setSyncStatusToast(null), 3000);
      }
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await forgetSilentSignIn();
    await logout();
    // The household's transactions stay out of the cache once its member has signed out.
    if (householdId) {
      setHouseholdId(null);
      setTransactions(MOCK_CARD_TRANSACTIONS);
      saveCachedTransactions(MOCK_CARD_TRANSACTIONS);
    }
  };

  // Sync data from connected Google Sheet (supports interactive click-to-reconnect)
  const syncFromGoogleSheet = useCallback(
    async (configToUse?: SheetConfig, isInteractive = false) => {
      if (householdId) {
        // Firestore streams changes as they land; there is nothing to pull.
        if (isInteractive) {
          setSyncStatusToast({ message: 'Live: updates arrive automatically', type: 'success' });
          setTimeout(() => setSyncStatusToast(null), 3000);
        }
        return;
      }
      const config = configToUse || sheetConfig;
      if (!config) return;

      try {
        setIsRefreshing(true);
        let token = await getAccessToken();

        let rows: string[][] | null = null;
        try {
          // Try fetching (uses OAuth token if available, or automatic public/shared link fallback)
          rows = await getSpreadsheetRowsUniversal(
            token,
            config.spreadsheetId,
            config.sheetName,
            'A1:Z1000'
          );
        } catch (initialErr: unknown) {
          // If fetch failed and this was triggered interactively (e.g. clicking Refresh):
          if (isInteractive) {
            try {
              setSyncStatusToast({
                message: 'Connecting to Google...',
                type: 'success',
              });
              const authResult = await googleSignIn();
              if (authResult?.accessToken) {
                token = authResult.accessToken;
                setHasGoogleAuth(true);
                setCurrentUser(authResult.user);
                rows = await getSpreadsheetRowsUniversal(
                  token,
                  config.spreadsheetId,
                  config.sheetName,
                  'A1:Z1000'
                );
              }
            } catch (authErr: unknown) {
              console.warn('Interactive auth cancelled or failed:', authErr);
              throw initialErr;
            }
          } else {
            // Background 15-min timer on locked sheet: silently exit without annoying banners
            setHasGoogleAuth(false);
            return;
          }
        }

        if (!rows || rows.length < 2) {
          throw new Error('Spreadsheet has no data rows.');
        }

        const parsed = parseSheetRowsToTransactions(
          rows,
          config.mapping,
          settings.ignoredKeywords
        );

        if (parsed.length > 0) {
          setTransactions(parsed);
          saveCachedTransactions(parsed);
          setHasGoogleAuth(true);

          // Update last synced timestamp
          const updatedConfig: SheetConfig = {
            ...config,
            lastSyncedAt: new Date().toISOString(),
          };
          setSheetConfig(updatedConfig);
          saveSheetConfig(updatedConfig);

          setSyncStatusToast({
            message: `Synced ${parsed.length} card charges from Google Sheets`,
            type: 'success',
          });
        } else {
          setSyncStatusToast({
            message: 'No card charges found (or all rows were filtered out as debits/mortgage).',
            type: 'error',
          });
        }
      } catch (err: unknown) {
        console.error('Sheet sync error:', err);
        const msg = err instanceof Error ? err.message : 'Failed to sync with Google Sheet';
        if (msg.includes('401') || msg.includes('authorization') || msg.includes('token')) {
          setHasGoogleAuth(false);
          setCachedAccessToken(null);
        }
        setSyncStatusToast({
          message: msg,
          type: 'error',
        });
      } finally {
        setIsRefreshing(false);
        setTimeout(() => setSyncStatusToast(null), 4000);
      }
    },
    [sheetConfig, settings.ignoredKeywords, householdId]
  );

  // 1-Click explicit reconnect
  const handleReconnectGoogle = async () => {
    try {
      setSyncStatusToast({ message: 'Connecting to Google...', type: 'success' });
      if (FIRESTORE_SOURCE_ENABLED) {
        // Plain sign-in first: household members need no Sheets/Drive permission at all.
        const user = currentUser ?? (await googleSignInBasic());
        setCurrentUser(user);
        const id = user.email ? await findHouseholdId(user.email) : null;
        if (id) {
          setHouseholdId(id);
          setSyncStatusToast({ message: 'Connected: live household data', type: 'success' });
          setTimeout(() => setSyncStatusToast(null), 3000);
          return;
        }
      }
      const res = await googleSignIn();
      if (res?.accessToken) {
        setHasGoogleAuth(true);
        setCurrentUser(res.user);
        syncFromGoogleSheet(sheetConfig || undefined, false);
      }
    } catch (err) {
      console.warn('Reconnect cancelled or failed:', err);
      setSyncStatusToast({ message: 'Google sign-in was cancelled', type: 'error' });
      setTimeout(() => setSyncStatusToast(null), 3000);
    }
  };

  // Auto-sync timer (every 15 mins if configured - silent background)
  useEffect(() => {
    if (!sheetConfig || householdId) return;
    const intervalMin = sheetConfig.autoSyncIntervalMinutes || 15;
    const intervalMs = intervalMin * 60 * 1000;

    const timer = setInterval(() => {
      syncFromGoogleSheet(undefined, false);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [sheetConfig, syncFromGoogleSheet, householdId]);

  // Available months extracted from transaction dates
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    // Ensure current month (2026-09) is present
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    monthSet.add(currentMonthKey);

    transactions.forEach((t) => {
      const match = t.date.match(/^(\d{4}-\d{2})/);
      if (match) {
        monthSet.add(match[1]);
      }
    });

    // Sort descending (latest month first)
    return Array.from(monthSet).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  // Currently selected month (default to latest)
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Keep selectedMonthKey valid when availableMonths changes
  useEffect(() => {
    if (!availableMonths.includes(selectedMonthKey) && availableMonths.length > 0) {
      setSelectedMonthKey(availableMonths[0]);
    }
  }, [availableMonths, selectedMonthKey]);

  // Monthly summary computed for the active month
  const monthlySummary = useMemo(() => {
    return aggregateMonthlySummary(transactions, selectedMonthKey);
  }, [transactions, selectedMonthKey]);

  // Handler for saving sheet configuration
  const handleSaveSheetConfig = (newConfig: SheetConfig) => {
    setSheetConfig(newConfig);
    saveSheetConfig(newConfig);
    syncFromGoogleSheet(newConfig);
  };

  const handleDisconnectSheet = () => {
    setSheetConfig(null);
    saveSheetConfig(null);
    setSyncStatusToast({ message: 'Disconnected Google Sheet', type: 'success' });
    setTimeout(() => setSyncStatusToast(null), 3000);
  };

  const handleSaveSettings = (newSettings: HouseholdSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleResetToDemoData = () => {
    setTransactions(MOCK_CARD_TRANSACTIONS);
    saveCachedTransactions(MOCK_CARD_TRANSACTIONS);
    setSyncStatusToast({ message: 'Reloaded sample card spending data', type: 'success' });
    setTimeout(() => setSyncStatusToast(null), 3000);
  };

  const handleImportTransactions = (importedTxs: CardTransaction[]) => {
    const existingKeys = new Set(
      transactions.map((t) => `${t.date}-${t.merchant.toLowerCase().trim()}-${t.amount.toFixed(2)}`)
    );
    const newItems = importedTxs.filter(
      (t) => !existingKeys.has(`${t.date}-${t.merchant.toLowerCase().trim()}-${t.amount.toFixed(2)}`)
    );
    const combined = [...newItems, ...transactions].sort((a, b) => b.date.localeCompare(a.date));
    setTransactions(combined);
    saveCachedTransactions(combined);
    setSyncStatusToast({
      message: `Added ${newItems.length} Chase card transactions to dashboard!`,
      type: 'success',
    });
    setTimeout(() => setSyncStatusToast(null), 5000);
  };

  const togglePrivacyBlur = () => {
    const updated: HouseholdSettings = {
      ...settings,
      showPrivacyBlur: !settings.showPrivacyBlur,
    };
    setSettings(updated);
    saveSettings(updated);
  };

  const toggleTheme = () => {
    const nextTheme: 'light' | 'dark' = settings.theme === 'light' ? 'dark' : 'light';
    const updated: HouseholdSettings = {
      ...settings,
      theme: nextTheme,
      ambientModeTheme: nextTheme,
    };
    setSettings(updated);
    saveSettings(updated);
  };

  const isLight = settings.theme === 'light';

  return (
    <div
      className={`relative min-h-screen font-sans antialiased selection:bg-forest-200 selection:text-forest-900 transition-colors duration-300 ${
        isLight ? 'bg-cream text-stone-800' : 'dark bg-forest-900 text-stone-100'
      }`}
    >
      {/* Toast alert */}
      {syncStatusToast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg shadow-stone-900/10 border text-sm font-medium flex items-center gap-2 transition-all ${
            syncStatusToast.type === 'success'
              ? 'bg-forest-700 border-forest-600 text-white'
              : 'bg-terracotta-dark border-terracotta text-white'
          }`}
        >
          <span>{syncStatusToast.message}</span>
        </div>
      )}

      {/* Main View: Ambient Hub Display vs Interactive Dashboard */}
      {isAmbientMode ? (
        <AmbientDashboard
          monthlySummary={monthlySummary}
          settings={settings}
          sheetConfig={sheetConfig}
          hasGoogleAuth={hasGoogleAuth || !!householdId}
          onExitAmbient={() => setIsAmbientMode(false)}
          onRefresh={() => syncFromGoogleSheet(undefined, true)}
          isRefreshing={isRefreshing}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenSheetSync={() => setIsSheetModalOpen(true)}
          onTogglePrivacy={togglePrivacyBlur}
          onToggleTheme={toggleTheme}
          onOpenPixelGuide={() => setIsPixelGuideOpen(true)}
          onOpenSheetGuide={() => setIsSheetGuideOpen(true)}
        />
      ) : (
        <InteractiveDashboard
          monthlySummary={monthlySummary}
          availableMonths={availableMonths}
          selectedMonthKey={selectedMonthKey}
          onSelectMonth={setSelectedMonthKey}
          settings={settings}
          sheetConfig={sheetConfig}
          hasGoogleAuth={hasGoogleAuth || !!householdId}
          onReconnectGoogle={handleReconnectGoogle}
          isLiveHousehold={!!householdId}
          isSignedIn={!!currentUser}
          user={authResolved ? currentUser : undefined}
          signingIn={signingIn}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          onEnterAmbient={() => setIsAmbientMode(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenSheetSync={() => setIsSheetModalOpen(true)}
          onRefresh={() => syncFromGoogleSheet(undefined, true)}
          isRefreshing={isRefreshing}
          onTogglePrivacy={togglePrivacyBlur}
          onToggleTheme={toggleTheme}
          selectedCard={selectedCard}
          onSelectCard={setSelectedCard}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onOpenPixelGuide={() => setIsPixelGuideOpen(true)}
          onOpenSheetGuide={handleOpenSheetGuide}
        />
      )}

      {/* Google Sheets Sync & Picker Modal */}
      <SheetSyncModal
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
        currentUser={currentUser}
        currentConfig={sheetConfig}
        onSaveConfig={handleSaveSheetConfig}
        onDisconnectConfig={handleDisconnectSheet}
        theme={settings.theme}
        onOpenFullGuide={(tab) => handleOpenSheetGuide(tab || 'quickstart')}
        onImportTransactions={handleImportTransactions}
      />

      {/* Household & Filter Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onResetToDemoData={handleResetToDemoData}
      />

      {/* Pixel Tablet Installation & QR Code Modal */}
      <PixelInstallModal
        isOpen={isPixelGuideOpen}
        onClose={() => setIsPixelGuideOpen(false)}
        theme={settings.theme}
      />

      {/* Google Sheet Data & Drive Guide Modal */}
      <GoogleSheetGuideModal
        isOpen={isSheetGuideOpen}
        onClose={() => setIsSheetGuideOpen(false)}
        onOpenSyncModal={() => setIsSheetModalOpen(true)}
        theme={settings.theme}
        initialTab={sheetGuideTab}
      />
    </div>
  );
}

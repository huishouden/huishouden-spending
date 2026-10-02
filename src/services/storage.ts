import { CardTransaction, HouseholdSettings, SheetConfig } from '../types';
export type { CardTransaction, HouseholdSettings, SheetConfig };
import { MOCK_CARD_TRANSACTIONS } from './mockData';

const SETTINGS_KEY = 'household_spend_settings';
const SHEET_CONFIG_KEY = 'household_sheet_config';
const TRANSACTIONS_CACHE_KEY = 'household_transactions_cache';

export const DEFAULT_SETTINGS: HouseholdSettings = {
  theme: 'light',
  monthlyBudget: 2000,
  householdName: 'Household Card Spend',
  currencySymbol: '$',
  ambientModeTheme: 'light',
  ambientRefreshRateMinutes: 15,
  showPrivacyBlur: false,
  dockModeAutoStart: false,
  ignoredKeywords: ['mortgage', 'rent payment', 'lease', 'direct debit', 'payment thank you', 'chase payment', 'robinhood payment'],
};

export function loadSettings(): HouseholdSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      theme: parsed.theme || 'light',
      ambientModeTheme: parsed.ambientModeTheme || 'light',
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: HouseholdSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function loadSheetConfig(): SheetConfig | null {
  try {
    const raw = localStorage.getItem(SHEET_CONFIG_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSheetConfig(config: SheetConfig | null): void {
  try {
    if (config) {
      localStorage.setItem(SHEET_CONFIG_KEY, JSON.stringify(config));
    } else {
      localStorage.removeItem(SHEET_CONFIG_KEY);
    }
  } catch (e) {
    console.error('Failed to save sheet config:', e);
  }
}

export function loadCachedTransactions(): CardTransaction[] {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_CACHE_KEY);
    if (!raw) return MOCK_CARD_TRANSACTIONS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : MOCK_CARD_TRANSACTIONS;
  } catch {
    return MOCK_CARD_TRANSACTIONS;
  }
}

export function saveCachedTransactions(txs: CardTransaction[]): void {
  try {
    localStorage.setItem(TRANSACTIONS_CACHE_KEY, JSON.stringify(txs));
  } catch (e) {
    console.error('Failed to save transactions cache:', e);
  }
}

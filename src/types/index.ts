export interface CardTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  merchant: string;
  amount: number; // positive = spend/charge
  category: string;
  cardName: string; // as named in the sheet's Cards tab
  cardType?: 'chase' | 'robinhood' | 'other';
  last4?: string;
  notes?: string;
  isDebitOrMortgage?: boolean; // filtered out if true
}

export interface CategorySummary {
  category: string;
  total: number;
  percentage: number;
  transactionCount: number;
  color: string;
  iconName: string;
}

export interface CardSummary {
  cardName: string;
  cardType: 'chase' | 'robinhood' | 'other';
  total: number;
  percentage: number;
  transactionCount: number;
  color: string;
  cashbackEstimate?: number;
}

export interface MonthlySummary {
  monthKey: string; // YYYY-MM
  monthName: string; // e.g. "September 2026"
  totalSpend: number;
  previousMonthSpend?: number;
  transactionCount: number;
  dailyAverage: number;
  projectedMonthEnd: number;
  categories: CategorySummary[];
  cards: CardSummary[];
  transactions: CardTransaction[];
}

export interface ColumnMapping {
  dateCol: string;
  merchantCol: string;
  amountCol: string;
  categoryCol: string;
  cardCol: string;
  notesCol?: string;
}

export interface SheetConfig {
  spreadsheetId: string;
  spreadsheetTitle: string;
  sheetName: string;
  lastSyncedAt?: string;
  mapping: ColumnMapping;
  autoSyncIntervalMinutes: number; // e.g. 15, 30, 60
}

export interface HouseholdSettings {
  theme: 'light' | 'dark';
  monthlyBudget: number;
  householdName: string;
  currencySymbol: string;
  ambientModeTheme: 'light' | 'dark' | 'oled';
  ambientRefreshRateMinutes: number;
  showPrivacyBlur: boolean;
  dockModeAutoStart: boolean;
  ignoredKeywords: string[]; // e.g. ['mortgage', 'rent', 'payroll', 'transfer', 'chase payment', 'robinhood payment', 'autopay']
}

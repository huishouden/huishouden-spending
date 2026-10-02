import { CardTransaction, MonthlySummary, CategorySummary, CardSummary } from '../types';

export interface CategoryColorTheme {
  bg: string;
  darkBg: string;
  text: string;
  darkText: string;
  bar: string;
  icon: string;
}

export const CATEGORY_COLORS: Record<string, CategoryColorTheme> = {
  Groceries: {
    bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    darkBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    text: 'text-emerald-700',
    darkText: 'text-emerald-400',
    bar: 'bg-emerald-500',
    icon: 'ShoppingCart',
  },
  'Dining & Food': {
    bg: 'bg-amber-100 text-amber-900 border-amber-200',
    darkBg: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    text: 'text-amber-800',
    darkText: 'text-amber-400',
    bar: 'bg-amber-500',
    icon: 'Utensils',
  },
  'Shopping & Retail': {
    bg: 'bg-blue-100 text-blue-900 border-blue-200',
    darkBg: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    text: 'text-blue-700',
    darkText: 'text-blue-400',
    bar: 'bg-blue-600',
    icon: 'ShoppingBag',
  },
  'Gas & Transport': {
    bg: 'bg-cyan-100 text-cyan-900 border-cyan-200',
    darkBg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
    text: 'text-cyan-800',
    darkText: 'text-cyan-400',
    bar: 'bg-cyan-600',
    icon: 'Fuel',
  },
  'Subscriptions & Tech': {
    bg: 'bg-purple-100 text-purple-900 border-purple-200',
    darkBg: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
    text: 'text-purple-700',
    darkText: 'text-purple-400',
    bar: 'bg-purple-600',
    icon: 'Tv',
  },
  'Home & Garden': {
    bg: 'bg-orange-100 text-orange-900 border-orange-200',
    darkBg: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
    text: 'text-orange-800',
    darkText: 'text-orange-400',
    bar: 'bg-orange-500',
    icon: 'Home',
  },
  'Health & Personal Care': {
    bg: 'bg-rose-100 text-rose-900 border-rose-200',
    darkBg: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
    text: 'text-rose-700',
    darkText: 'text-rose-400',
    bar: 'bg-rose-600',
    icon: 'HeartPulse',
  },
  'Travel & Lodging': {
    bg: 'bg-indigo-100 text-indigo-900 border-indigo-200',
    darkBg: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
    text: 'text-indigo-700',
    darkText: 'text-indigo-400',
    bar: 'bg-indigo-600',
    icon: 'Plane',
  },
  Entertainment: {
    bg: 'bg-pink-100 text-pink-900 border-pink-200',
    darkBg: 'bg-pink-500/15 text-pink-400 border-pink-500/20',
    text: 'text-pink-700',
    darkText: 'text-pink-400',
    bar: 'bg-pink-500',
    icon: 'Sparkles',
  },
  Miscellaneous: {
    bg: 'bg-slate-100 text-slate-800 border-slate-200',
    darkBg: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
    text: 'text-slate-700',
    darkText: 'text-slate-400',
    bar: 'bg-slate-500',
    icon: 'Tag',
  },
};

export const MOCK_CARD_TRANSACTIONS: CardTransaction[] = [
  // September 2026 (Current Month)
  {
    id: 'tx-sep-26-1',
    date: '2026-09-26',
    merchant: 'Trader Joe\'s',
    amount: 142.80,
    category: 'Groceries',
    cardName: 'Example Visa',
    cardType: 'robinhood',
    notes: 'Weekly pantry & fresh produce',
  },
  {
    id: 'tx-sep-25-1',
    date: '2026-09-25',
    merchant: 'The Olive Branch Bistro',
    amount: 88.50,
    category: 'Dining & Food',
    cardName: 'Example Rewards Card',
    cardType: 'chase',
    notes: 'Dinner date night',
  },
  {
    id: 'tx-sep-24-1',
    date: '2026-09-24',
    merchant: 'Costco Wholesale',
    amount: 284.15,
    category: 'Groceries',
    cardName: 'Example Visa',
    cardType: 'robinhood',
    notes: 'Paper goods & household bulk',
  },
  {
    id: 'tx-sep-23-1',
    date: '2026-09-23',
    merchant: 'Chevron Fuel',
    amount: 52.40,
    category: 'Gas & Transport',
    cardName: 'Example Visa',
    cardType: 'robinhood',
    notes: 'Fill up SUV',
  },
  {
    id: 'tx-sep-22-1',
    date: '2026-09-22',
    merchant: 'Target Store #1128',
    amount: 76.90,
    category: 'Shopping & Retail',
    cardName: 'Example Visa',
    cardType: 'robinhood',
    notes: 'School supplies & bathroom essentials',
  },
  {
    id: 'tx-sep-20-1',
    date: '2026-09-20',
    merchant: 'Home Depot',
    amount: 135.20,
    category: 'Home & Garden',
    cardName: 'Example Visa',
    cardType: 'robinhood',
    notes: 'Lawn fertilizer and air filters',
  },
  {
    id: 'tx-sep-19-1',
    date: '2026-09-19',
    merchant: 'Sushi Blossom',
    amount: 114.00,
    category: 'Dining & Food',
    cardName: 'Example Rewards Card',
    cardType: 'chase',
    notes: 'Family weekend dinner',
  },
  {
    id: 'tx-sep-18-1',
    date: '2026-09-18',
    merchant: 'Amazon.com',
    amount: 45.60,
    category: 'Shopping & Retail',
    cardName: 'Example Visa',
    cardType: 'robinhood',
    notes: 'Kitchen storage containers',
  },
  {
    id: 'tx-sep-16-1',
    date: '2026-09-16',
    merchant: 'Whole Foods Market',
    amount: 98.40,
    category: 'Groceries',
    cardName: 'Example Visa',
    cardType: 'robinhood',
    notes: 'Organic fruits and snacks',
  },
  {
    id: 'tx-sep-15-1',
    date: '2026-09-15',
    merchant: 'Netflix Subscription',
    amount: 22.99,
    category: 'Subscriptions & Tech',
    cardName: 'Example Everyday Card',
    cardType: 'chase',
    notes: 'Monthly 4K streaming plan',
  },
  {
    id: 'tx-sep-14-1',
    date: '2026-09-14',
    merchant: 'Spotify Family',
    amount: 19.99,
    category: 'Subscriptions & Tech',
    cardName: 'Example Everyday Card',
    cardType: 'chase',
    notes: 'Music plan',
  },
  {
    id: 'tx-sep-12-1',
    date: '2026-09-12',
    merchant: 'Blue Bottle Coffee',
    amount: 16.50,
    category: 'Dining & Food',
    cardName: 'Example Rewards Card',
    cardType: 'chase',
    notes: 'Saturday morning lattes',
  },
  {
    id: 'tx-sep-10-1',
    date: '2026-09-10',
    merchant: 'CVS Pharmacy',
    amount: 38.75,
    category: 'Health & Personal Care',
    cardName: 'Example Everyday Card',
    cardType: 'chase',
    notes: 'Vitamins & first-aid',
  },
  {
    id: 'tx-sep-08-1',
    date: '2026-09-08',
    merchant: 'Shell Oil',
    amount: 48.20,
    category: 'Gas & Transport',
    cardName: 'Example Visa',
    cardType: 'robinhood',
    notes: 'Gas fill-up',
  },
  {
    id: 'tx-sep-06-1',
    date: '2026-09-06',
    merchant: 'Albertsons Grocers',
    amount: 112.35,
    category: 'Groceries',
    cardName: 'Example Visa',
    cardType: 'robinhood',
    notes: 'Produce and deli counter',
  },
  {
    id: 'tx-sep-04-1',
    date: '2026-09-04',
    merchant: 'Chipotle Mexican Grill',
    amount: 34.60,
    category: 'Dining & Food',
    cardName: 'Example Rewards Card',
    cardType: 'chase',
    notes: 'Quick lunch for two',
  },
  {
    id: 'tx-sep-02-1',
    date: '2026-09-02',
    merchant: 'Apple Services (iCloud + TV)',
    amount: 14.98,
    category: 'Subscriptions & Tech',
    cardName: 'Example Visa',
    cardType: 'robinhood',
    notes: 'Cloud storage backup',
  },
  {
    id: 'tx-sep-01-1',
    date: '2026-09-01',
    merchant: 'Cinemark Theatres',
    amount: 42.00,
    category: 'Entertainment',
    cardName: 'Example Rewards Card',
    cardType: 'chase',
    notes: 'Movie tickets',
  },

  // August 2026
  {
    id: 'tx-aug-30-1',
    date: '2026-08-30',
    merchant: 'Costco Wholesale',
    amount: 312.45,
    category: 'Groceries',
    cardName: 'Example Visa',
    cardType: 'robinhood',
  },
  {
    id: 'tx-aug-28-1',
    date: '2026-08-28',
    merchant: 'Trader Joe\'s',
    amount: 154.20,
    category: 'Groceries',
    cardName: 'Example Visa',
    cardType: 'robinhood',
  },
  {
    id: 'tx-aug-25-1',
    date: '2026-08-25',
    merchant: 'Prime Steakhouse',
    amount: 185.00,
    category: 'Dining & Food',
    cardName: 'Example Rewards Card',
    cardType: 'chase',
    notes: 'Anniversary celebration',
  },
  {
    id: 'tx-aug-22-1',
    date: '2026-08-22',
    merchant: 'Target',
    amount: 118.40,
    category: 'Shopping & Retail',
    cardName: 'Example Visa',
    cardType: 'robinhood',
  },
  {
    id: 'tx-aug-18-1',
    date: '2026-08-18',
    merchant: 'Delta Airlines',
    amount: 462.80,
    category: 'Travel & Lodging',
    cardName: 'Example Rewards Card',
    cardType: 'chase',
    notes: 'Fall family visit flights',
  },
  {
    id: 'tx-aug-15-1',
    date: '2026-08-15',
    merchant: 'Chevron Gas',
    amount: 54.00,
    category: 'Gas & Transport',
    cardName: 'Example Visa',
    cardType: 'robinhood',
  },
  {
    id: 'tx-aug-12-1',
    date: '2026-08-12',
    merchant: 'Online Marketplace',
    amount: 89.95,
    category: 'Shopping & Retail',
    cardName: 'Example Visa',
    cardType: 'robinhood',
  },
  {
    id: 'tx-aug-10-1',
    date: '2026-08-10',
    merchant: 'Whole Foods Market',
    amount: 122.50,
    category: 'Groceries',
    cardName: 'Example Visa',
    cardType: 'robinhood',
  },
  {
    id: 'tx-aug-07-1',
    date: '2026-08-07',
    merchant: 'Thai Basil Kitchen',
    amount: 64.30,
    category: 'Dining & Food',
    cardName: 'Example Rewards Card',
    cardType: 'chase',
  },
  {
    id: 'tx-aug-04-1',
    date: '2026-08-04',
    merchant: 'Home Depot',
    amount: 168.00,
    category: 'Home & Garden',
    cardName: 'Example Visa',
    cardType: 'robinhood',
  },
  {
    id: 'tx-aug-01-1',
    date: '2026-08-01',
    merchant: 'Netflix + Spotify + Apple',
    amount: 57.96,
    category: 'Subscriptions & Tech',
    cardName: 'Example Everyday Card',
    cardType: 'chase',
  },

  // July 2026
  {
    id: 'tx-jul-28-1',
    date: '2026-07-28',
    merchant: 'Marriott Resort',
    amount: 540.00,
    category: 'Travel & Lodging',
    cardName: 'Example Rewards Card',
    cardType: 'chase',
    notes: 'Summer weekend getaway',
  },
  {
    id: 'tx-jul-24-1',
    date: '2026-07-24',
    merchant: 'Costco Wholesale',
    amount: 275.60,
    category: 'Groceries',
    cardName: 'Example Visa',
    cardType: 'robinhood',
  },
  {
    id: 'tx-jul-19-1',
    date: '2026-07-19',
    merchant: 'Trader Joe\'s',
    amount: 139.10,
    category: 'Groceries',
    cardName: 'Example Visa',
    cardType: 'robinhood',
  },
  {
    id: 'tx-jul-14-1',
    date: '2026-07-14',
    merchant: 'Local Artisan Pizzeria',
    amount: 58.70,
    category: 'Dining & Food',
    cardName: 'Example Rewards Card',
    cardType: 'chase',
  },
  {
    id: 'tx-jul-10-1',
    date: '2026-07-10',
    merchant: 'REI Outdoor Goods',
    amount: 145.00,
    category: 'Shopping & Retail',
    cardName: 'Example Visa',
    cardType: 'robinhood',
  },
  {
    id: 'tx-jul-05-1',
    date: '2026-07-05',
    merchant: 'Chevron Fuel',
    amount: 61.20,
    category: 'Gas & Transport',
    cardName: 'Example Visa',
    cardType: 'robinhood',
  },
];

/**
 * Group transactions by month and compute aggregates
 */
export function aggregateMonthlySummary(
  transactions: CardTransaction[],
  targetMonthKey: string
): MonthlySummary {
  const monthTransactions = transactions.filter((t) => t.date.startsWith(targetMonthKey));
  const totalSpend = monthTransactions.reduce((acc, t) => acc + t.amount, 0);

  // Group by category
  const catMap = new Map<string, { total: number; count: number }>();
  monthTransactions.forEach((t) => {
    const curr = catMap.get(t.category) || { total: 0, count: 0 };
    curr.total += t.amount;
    curr.count += 1;
    catMap.set(t.category, curr);
  });

  const categories: CategorySummary[] = Array.from(catMap.entries())
    .map(([cat, data]) => ({
      category: cat,
      total: data.total,
      percentage: totalSpend > 0 ? (data.total / totalSpend) * 100 : 0,
      transactionCount: data.count,
      color: CATEGORY_COLORS[cat]?.bar || 'bg-slate-500',
      iconName: CATEGORY_COLORS[cat]?.icon || 'Tag',
    }))
    .sort((a, b) => b.total - a.total);

  // Group by card
  const cardMap = new Map<string, { total: number; count: number; type: 'chase' | 'robinhood' | 'other' }>();
  monthTransactions.forEach((t) => {
    const curr = cardMap.get(t.cardName) || { total: 0, count: 0, type: t.cardType || 'other' };
    curr.total += t.amount;
    curr.count += 1;
    cardMap.set(t.cardName, curr);
  });

  const cards: CardSummary[] = Array.from(cardMap.entries())
    .map(([cardName, data]) => {
      // Rough rewards estimate; real rates vary by card.
      const rate = 0.02;
      return {
        cardName,
        cardType: data.type,
        total: data.total,
        percentage: totalSpend > 0 ? (data.total / totalSpend) * 100 : 0,
        transactionCount: data.count,
        color:
          data.type === 'robinhood' ? 'from-amber-400 to-yellow-600' : 'from-blue-500 to-cyan-600',
        cashbackEstimate: data.total * rate,
      };
    })
    .sort((a, b) => b.total - a.total);

  // Compute days in month and daily average
  const [yearStr, monthStr] = targetMonthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const daysInMonth = new Date(year, month, 0).getDate();

  // If current month, calculate based on today's day
  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() + 1 === month;
  const daysElapsed = isCurrentMonth ? Math.min(today.getDate(), daysInMonth) : daysInMonth;

  const dailyAverage = daysElapsed > 0 ? totalSpend / daysElapsed : 0;
  const projectedMonthEnd = isCurrentMonth ? dailyAverage * daysInMonth : totalSpend;

  // Format month name e.g. "September 2026"
  const dateObj = new Date(year, month - 1, 1);
  const monthName = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Calculate previous month spend
  const prevMonthDate = new Date(year, month - 2, 1);
  const prevMonthKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const prevMonthTransactions = transactions.filter((t) => t.date.startsWith(prevMonthKey));
  const previousMonthSpend = prevMonthTransactions.reduce((acc, t) => acc + t.amount, 0);

  return {
    monthKey: targetMonthKey,
    monthName,
    totalSpend,
    previousMonthSpend: previousMonthSpend > 0 ? previousMonthSpend : undefined,
    transactionCount: monthTransactions.length,
    dailyAverage,
    projectedMonthEnd,
    categories,
    cards,
    transactions: monthTransactions,
  };
}

export type Category =
  | 'Food'
  | 'Transportation'
  | 'Entertainment'
  | 'Shopping'
  | 'Bills'
  | 'Other';

export const CATEGORIES: Category[] = [
  'Food',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Bills',
  'Other',
];

export type PaymentMethod =
  | 'Credit Card'
  | 'Debit Card'
  | 'Cash'
  | 'Bank Transfer'
  | 'Mobile Payment'
  | 'Other';

export const PAYMENT_METHODS: PaymentMethod[] = [
  'Credit Card',
  'Debit Card',
  'Cash',
  'Bank Transfer',
  'Mobile Payment',
  'Other',
];

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: Category;
  date: string; // ISO format: YYYY-MM-DD
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseFormData = Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>;

export type DateRangePreset =
  | 'all'
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'custom';

export type SortOption =
  | 'date_desc'
  | 'date_asc'
  | 'amount_desc'
  | 'amount_asc'
  | 'description_asc';

export interface ExpenseFilters {
  search: string;
  category: 'all' | Category;
  datePreset: DateRangePreset;
  startDate: string;
  endDate: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy: SortOption;
}

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  locale: string;
}

export interface CategoryInfo {
  name: Category;
  label: string;
  color: string;
  bgLight: string;
  bgDark: string;
  borderLight: string;
  borderDark: string;
  textLight: string;
  textDark: string;
  hexColor: string;
  icon: string;
  defaultMonthlyBudget: number;
}

export interface BudgetSettings {
  overallMonthly: number;
  categoryBudgets: Record<Category, number>;
}

export interface SpendingSummary {
  totalSpent: number;
  thisMonthSpent: number;
  lastMonthSpent: number;
  monthlyChangePercent: number;
  thisWeekSpent: number;
  todaySpent: number;
  averageExpense: number;
  totalCount: number;
  topCategory: { category: Category; amount: number; count: number } | null;
  categoryBreakdown: Array<{
    category: Category;
    amount: number;
    count: number;
    percentage: number;
  }>;
}

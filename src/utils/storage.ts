import { BudgetSettings, CurrencyCode, Expense } from '@/types/expense';
import { DEFAULT_BUDGET } from './constants';
import { getSampleExpenses } from './sampleData';

const EXPENSES_STORAGE_KEY = 'expense_tracker_expenses_v1';
const CURRENCY_STORAGE_KEY = 'expense_tracker_currency_v1';
const THEME_STORAGE_KEY = 'expense_tracker_theme_v1';
const BUDGET_STORAGE_KEY = 'expense_tracker_budget_v1';
const INITIALIZED_STORAGE_KEY = 'expense_tracker_initialized_v1';

export function getStoredExpenses(): Expense[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(EXPENSES_STORAGE_KEY);
    if (!raw) {
      // First time initialization: populate with sample data
      const isInitialized = localStorage.getItem(INITIALIZED_STORAGE_KEY);
      if (!isInitialized) {
        const samples = getSampleExpenses();
        localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(samples));
        localStorage.setItem(INITIALIZED_STORAGE_KEY, 'true');
        return samples;
      }
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to load expenses from localStorage:', error);
    return [];
  }
}

export function saveStoredExpenses(expenses: Expense[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
  } catch (error) {
    console.error('Failed to save expenses to localStorage:', error);
  }
}

export function getStoredCurrency(): CurrencyCode {
  if (typeof window === 'undefined') return 'USD';
  try {
    const raw = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (raw && ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'].includes(raw)) {
      return raw as CurrencyCode;
    }
  } catch {}
  return 'USD';
}

export function saveStoredCurrency(currency: CurrencyCode): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
  } catch (error) {
    console.error('Failed to save currency:', error);
  }
}

export function getStoredTheme(): 'light' | 'dark' | 'system' {
  if (typeof window === 'undefined') return 'system';
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  } catch {}
  return 'system';
}

export function saveStoredTheme(theme: 'light' | 'dark' | 'system'): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.error('Failed to save theme:', error);
  }
}

export function getStoredBudget(): BudgetSettings {
  if (typeof window === 'undefined') return DEFAULT_BUDGET;
  try {
    const raw = localStorage.getItem(BUDGET_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return DEFAULT_BUDGET;
}

export function saveStoredBudget(budget: BudgetSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(budget));
  } catch (error) {
    console.error('Failed to save budget:', error);
  }
}

export function resetToSampleData(): Expense[] {
  const samples = getSampleExpenses();
  saveStoredExpenses(samples);
  return samples;
}

export function clearAllExpenseData(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify([]));
  } catch (error) {
    console.error('Failed to clear expenses:', error);
  }
}

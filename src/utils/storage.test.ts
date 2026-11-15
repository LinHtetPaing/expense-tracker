import { afterEach, describe, expect, it } from 'vitest';
import { Expense } from '@/types/expense';
import { DEFAULT_BUDGET } from '@/utils/constants';
import {
  clearAllExpenseData,
  getStoredBudget,
  getStoredCurrency,
  getStoredExpenses,
  getStoredTheme,
  resetToSampleData,
  saveStoredBudget,
  saveStoredCurrency,
  saveStoredExpenses,
  saveStoredTheme,
} from '@/utils/storage';

const EXPENSES_KEY = 'expense_tracker_expenses_v1';
const CURRENCY_KEY = 'expense_tracker_currency_v1';
const THEME_KEY = 'expense_tracker_theme_v1';
const BUDGET_KEY = 'expense_tracker_budget_v1';
const INITIALIZED_KEY = 'expense_tracker_initialized_v1';

function expense(): Expense {
  return {
    id: 'exp-1',
    description: 'Lunch',
    amount: 12,
    category: 'Food',
    date: '2026-11-13',
    paymentMethod: 'Cash',
    createdAt: '2026-11-13T00:00:00.000Z',
    updatedAt: '2026-11-13T00:00:00.000Z',
  };
}

function installStorage() {
  const store = new Map<string, string>();
  const localStorage = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
  Object.assign(globalThis, { window: globalThis, localStorage });
  return { store, localStorage };
}

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
  delete (globalThis as { localStorage?: unknown }).localStorage;
});

describe('expense storage', () => {
  it('returns safe defaults when there is no browser storage', () => {
    expect(getStoredExpenses()).toEqual([]);
    expect(getStoredCurrency()).toBe('USD');
    expect(getStoredTheme()).toBe('system');
    expect(getStoredBudget()).toEqual(DEFAULT_BUDGET);

    saveStoredExpenses([expense()]);
    saveStoredCurrency('EUR');
    expect(getStoredExpenses()).toEqual([]);
  });

  it('seeds sample expenses once, then keeps an explicit empty ledger', () => {
    const { localStorage } = installStorage();

    const seeded = getStoredExpenses();
    expect(seeded.length).toBeGreaterThan(0);
    expect(seeded.every((item) => item.amount > 0 && item.id && item.date)).toBe(true);
    expect(localStorage.getItem(INITIALIZED_KEY)).toBe('true');
    expect(localStorage.getItem(EXPENSES_KEY)).toBe(JSON.stringify(seeded));

    localStorage.setItem(EXPENSES_KEY, '');
    expect(getStoredExpenses()).toEqual([]);
  });

  it('round-trips saved expenses, currency, theme, and budget', () => {
    installStorage();
    localStorage.setItem(INITIALIZED_KEY, 'true');

    saveStoredExpenses([expense()]);
    saveStoredCurrency('EUR');
    saveStoredTheme('dark');
    saveStoredBudget({ ...DEFAULT_BUDGET, overallMonthly: 1800 });

    expect(getStoredExpenses()).toEqual([expense()]);
    expect(getStoredCurrency()).toBe('EUR');
    expect(getStoredTheme()).toBe('dark');
    expect(getStoredBudget().overallMonthly).toBe(1800);
    expect(localStorage.getItem(CURRENCY_KEY)).toBe('EUR');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
    expect(localStorage.getItem(BUDGET_KEY)).toContain('1800');
  });

  it('ignores corrupt or unsupported stored values', () => {
    const { localStorage } = installStorage();
    localStorage.setItem(INITIALIZED_KEY, 'true');
    localStorage.setItem(EXPENSES_KEY, '{');
    localStorage.setItem(CURRENCY_KEY, 'usd');
    localStorage.setItem(THEME_KEY, 'blue');
    localStorage.setItem(BUDGET_KEY, '{');

    expect(getStoredExpenses()).toEqual([]);
    expect(getStoredCurrency()).toBe('USD');
    expect(getStoredTheme()).toBe('system');
    expect(getStoredBudget()).toEqual(DEFAULT_BUDGET);

    localStorage.setItem(EXPENSES_KEY, JSON.stringify({ not: 'a list' }));
    expect(getStoredExpenses()).toEqual([]);
  });

  it('clears the ledger without throwing when storage writes fail', () => {
    const { localStorage } = installStorage();
    saveStoredExpenses([expense()]);
    clearAllExpenseData();
    expect(JSON.parse(localStorage.getItem(EXPENSES_KEY) || 'null')).toEqual([]);

    localStorage.setItem = () => {
      throw new Error('quota');
    };
    expect(() => saveStoredExpenses([expense()])).not.toThrow();
    expect(() => saveStoredCurrency('GBP')).not.toThrow();
    expect(() => saveStoredTheme('light')).not.toThrow();
    expect(() => saveStoredBudget(DEFAULT_BUDGET)).not.toThrow();
    expect(() => clearAllExpenseData()).not.toThrow();
  });

  it('returns safe defaults when a stored value cannot be read', () => {
    installStorage();
    localStorage.getItem = () => {
      throw new Error('blocked');
    };

    expect(getStoredExpenses()).toEqual([]);
    expect(getStoredCurrency()).toBe('USD');
    expect(getStoredTheme()).toBe('system');
    expect(getStoredBudget()).toEqual(DEFAULT_BUDGET);
  });

  it('keeps every supported currency and the full budget', () => {
    installStorage();
    localStorage.setItem(INITIALIZED_KEY, 'true');

    for (const currency of ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'] as const) {
      saveStoredCurrency(currency);
      expect(getStoredCurrency()).toBe(currency);
    }

    const budget = {
      overallMonthly: 1800,
      categoryBudgets: {
        Food: 1,
        Transportation: 2,
        Entertainment: 3,
        Shopping: 4,
        Bills: 5,
        Other: 6,
      },
    };
    saveStoredBudget(budget);
    expect(getStoredBudget()).toEqual(budget);

    localStorage.setItem(CURRENCY_KEY, 'EUR ');
    expect(getStoredCurrency()).toBe('USD');
  });

  it('clears the ledger without bringing samples back or wiping currency and budget', () => {
    const { localStorage } = installStorage();

    expect(getStoredExpenses().length).toBeGreaterThan(0);
    saveStoredCurrency('JPY');
    const budget = {
      ...DEFAULT_BUDGET,
      overallMonthly: 900,
      categoryBudgets: { ...DEFAULT_BUDGET.categoryBudgets, Food: 111 },
    };
    saveStoredBudget(budget);

    clearAllExpenseData();

    expect(getStoredExpenses()).toEqual([]);
    expect(getStoredCurrency()).toBe('JPY');
    expect(getStoredBudget()).toEqual(budget);
    expect(localStorage.getItem(INITIALIZED_KEY)).toBe('true');
    expect(JSON.parse(localStorage.getItem(EXPENSES_KEY) || 'null')).toEqual([]);
  });

  it('replaces the ledger with the sample set', () => {
    const { localStorage } = installStorage();
    localStorage.setItem(INITIALIZED_KEY, 'true');
    saveStoredExpenses([]);

    const samples = resetToSampleData();
    expect(samples.length).toBeGreaterThan(0);
    expect(getStoredExpenses()).toEqual(samples);
  });
});

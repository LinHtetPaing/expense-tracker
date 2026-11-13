import { describe, expect, it } from 'vitest';
import { Expense, ExpenseFilters } from '@/types/expense';
import { DEFAULT_FILTERS } from '@/utils/constants';
import { filterExpenses, mergeImportedExpenses, summarizeExpenses } from '@/utils/expenseStats';

const NOW = new Date(2026, 10, 13, 15, 30, 0);

function expense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'exp-1',
    description: 'Lunch',
    amount: 10,
    category: 'Food',
    date: '2026-11-13',
    paymentMethod: 'Cash',
    notes: '',
    createdAt: '2026-11-13T00:00:00.000Z',
    updatedAt: '2026-11-13T00:00:00.000Z',
    ...overrides,
  };
}

function filters(overrides: Partial<ExpenseFilters> = {}): ExpenseFilters {
  return { ...DEFAULT_FILTERS, ...overrides };
}

describe('filterExpenses', () => {
  const expenses = [
    expense({ id: 'today', description: 'Morning coffee', amount: 4, date: '2026-11-13', notes: 'latte' }),
    expense({
      id: 'week',
      description: 'Train pass',
      amount: 20,
      category: 'Transportation',
      date: '2026-11-09',
      paymentMethod: 'Credit Card',
    }),
    expense({
      id: 'before-week',
      description: 'Sunday market',
      amount: 8,
      date: '2026-11-08',
    }),
    expense({
      id: 'last-month',
      description: 'Rent',
      amount: 40,
      category: 'Bills',
      date: '2026-10-31',
      paymentMethod: 'Bank Transfer',
    }),
    expense({
      id: 'next-year',
      description: 'Deposit',
      amount: 15,
      category: 'Shopping',
      date: '2027-01-01',
    }),
  ];

  it('matches search text in the description, notes, category, and payment method', () => {
    expect(filterExpenses(expenses, filters({ search: '  COFFEE ' }), NOW).map((item) => item.id)).toEqual([
      'today',
    ]);
    expect(filterExpenses(expenses, filters({ search: 'LATTE' }), NOW).map((item) => item.id)).toEqual(['today']);
    expect(filterExpenses(expenses, filters({ search: 'bills' }), NOW).map((item) => item.id)).toEqual([
      'last-month',
    ]);
    expect(filterExpenses(expenses, filters({ search: 'bank transfer' }), NOW).map((item) => item.id)).toEqual([
      'last-month',
    ]);
    expect(filterExpenses(expenses, filters({ search: 'missing' }), NOW)).toEqual([]);
  });

  it('ignores a blank search and keeps amount boundaries inclusive', () => {
    expect(filterExpenses(expenses, filters({ search: '   ' }), NOW)).toHaveLength(expenses.length);
    expect(
      filterExpenses(expenses, filters({ minAmount: 8, maxAmount: 20 }), NOW).map((item) => item.id)
    ).toEqual(['next-year', 'week', 'before-week']);
  });

  it('filters by category', () => {
    expect(filterExpenses(expenses, filters({ category: 'Bills' }), NOW).map((item) => item.id)).toEqual([
      'last-month',
    ]);
  });

  it('uses Monday as the start of the current week and includes both ends', () => {
    expect(filterExpenses(expenses, filters({ datePreset: 'this_week' }), NOW).map((item) => item.id)).toEqual([
      'today',
      'week',
    ]);
    expect(filterExpenses(expenses, filters({ datePreset: 'today' }), NOW).map((item) => item.id)).toEqual([
      'today',
    ]);
  });

  it('keeps last month, this year, and a custom range on their calendar boundaries', () => {
    expect(filterExpenses(expenses, filters({ datePreset: 'last_month' }), NOW).map((item) => item.id)).toEqual([
      'last-month',
    ]);
    expect(filterExpenses(expenses, filters({ datePreset: 'this_year' }), NOW).map((item) => item.id)).toEqual([
      'today',
      'week',
      'before-week',
      'last-month',
    ]);
    expect(
      filterExpenses(
        expenses,
        filters({ datePreset: 'custom', startDate: '2026-11-08', endDate: '2026-11-09' }),
        NOW
      ).map((item) => item.id)
    ).toEqual(['week', 'before-week']);
  });

  it('drops records with an unusable date when a date window is active', () => {
    const broken = expense({ id: 'broken', date: 'not-a-date' });
    expect(filterExpenses([broken], filters({ datePreset: 'all' }), NOW).map((item) => item.id)).toEqual([
      'broken',
    ]);
    expect(filterExpenses([broken], filters({ datePreset: 'this_month' }), NOW)).toEqual([]);
  });

  it('sorts by amount and description', () => {
    expect(filterExpenses(expenses, filters({ sortBy: 'amount_asc' }), NOW).map((item) => item.amount)).toEqual([
      4, 8, 15, 20, 40,
    ]);
    expect(
      filterExpenses(
        [expense({ id: 'b', description: 'Beta' }), expense({ id: 'a', description: 'Alpha' })],
        filters({ sortBy: 'description_asc' }),
        NOW
      ).map((item) => item.description)
    ).toEqual(['Alpha', 'Beta']);
  });
});

describe('summarizeExpenses', () => {
  it('returns zeros and no top category when there are no expenses', () => {
    const summary = summarizeExpenses([], NOW);

    expect(summary.totalSpent).toBe(0);
    expect(summary.thisMonthSpent).toBe(0);
    expect(summary.lastMonthSpent).toBe(0);
    expect(summary.monthlyChangePercent).toBe(0);
    expect(summary.averageExpense).toBe(0);
    expect(summary.totalCount).toBe(0);
    expect(summary.topCategory).toBeNull();
    expect(summary.categoryBreakdown.every((item) => item.amount === 0)).toBe(true);
  });

  it('splits spending across today, this week, this month, last month, and the year', () => {
    const summary = summarizeExpenses(
      [
        expense({ amount: 10, category: 'Food', date: '2026-11-13' }),
        expense({ amount: 20, category: 'Transportation', date: '2026-11-10' }),
        expense({ amount: 40, category: 'Bills', date: '2026-10-15' }),
        expense({ amount: 5, category: 'Shopping', date: '2026-12-31' }),
        expense({ amount: 8, category: 'Food', date: '2026-01-01' }),
        expense({ amount: 7, category: 'Other', date: 'not-a-date' }),
      ],
      NOW
    );

    expect(summary.totalSpent).toBe(90);
    expect(summary.todaySpent).toBe(10);
    expect(summary.thisWeekSpent).toBe(30);
    expect(summary.thisMonthSpent).toBe(30);
    expect(summary.lastMonthSpent).toBe(40);
    expect(summary.monthlyChangePercent).toBe(-25);
    expect(summary.averageExpense).toBe(15);
    expect(summary.totalCount).toBe(6);
    expect(summary.topCategory).toEqual({ category: 'Bills', amount: 40, count: 1 });
    expect(summary.categoryBreakdown.find((item) => item.category === 'Bills')?.percentage).toBe(44.4);
    expect(summary.categoryBreakdown.find((item) => item.category === 'Food')?.percentage).toBe(20);
    expect(summary.categoryBreakdown.find((item) => item.category === 'Entertainment')?.amount).toBe(0);
  });
});

describe('mergeImportedExpenses', () => {
  it('keeps new ids and replaces ids that already exist', () => {
    const existing = [expense({ id: 'kept' })];
    const imported = [expense({ id: 'fresh', description: 'Imported' }), expense({ id: 'kept', description: 'Clash' })];

    const merged = mergeImportedExpenses(existing, imported, () => 'generated-id');

    expect(merged.map((item) => item.id)).toEqual(['fresh', 'generated-id', 'kept']);
    expect(merged[0].description).toBe('Imported');
    expect(merged[1].description).toBe('Clash');
  });

  it('does not rename a repeated imported id that is new to the ledger', () => {
    const merged = mergeImportedExpenses(
      [],
      [expense({ id: 'same' }), expense({ id: 'same', description: 'Second' })],
      () => 'unused'
    );

    expect(merged.map((item) => item.id)).toEqual(['same', 'same']);
  });
});

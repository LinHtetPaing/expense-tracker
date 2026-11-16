import { describe, expect, it } from 'vitest';
import { Expense, ExpenseFilters } from '@/types/expense';
import { DEFAULT_FILTERS } from '@/utils/constants';
import {
  filterExpenses,
  hasActiveExpenseFilters,
  mergeImportedExpenses,
  monthlySpendingComparison,
  summarizeExpenses,
} from '@/utils/expenseStats';

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
    expect(filterExpenses(expenses, filters({ minAmount: 20, maxAmount: 8 }), NOW)).toEqual([]);
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

  it('includes the first and last day of the month and stops at the next month', () => {
    const dated = [
      expense({ id: 'month-start', date: '2026-11-01' }),
      expense({ id: 'month-end', date: '2026-11-30' }),
      expense({ id: 'next-month', date: '2026-12-01' }),
      expense({ id: 'week-end', date: '2026-11-15' }),
      expense({ id: 'next-week', date: '2026-11-16' }),
    ];

    expect(filterExpenses(dated, filters({ datePreset: 'this_month' }), NOW).map((item) => item.id)).toEqual([
      'month-end',
      'next-week',
      'week-end',
      'month-start',
    ]);
    expect(filterExpenses(dated, filters({ datePreset: 'this_week' }), NOW).map((item) => item.id)).toEqual([
      'week-end',
    ]);
  });

  it('keeps an open custom range on the provided side only', () => {
    expect(
      filterExpenses(expenses, filters({ datePreset: 'custom', startDate: '2026-11-13' }), NOW).map(
        (item) => item.id
      )
    ).toEqual(['next-year', 'today']);
    expect(
      filterExpenses(expenses, filters({ datePreset: 'custom', endDate: '2026-11-09' }), NOW).map(
        (item) => item.id
      )
    ).toEqual(['week', 'before-week', 'last-month']);
    expect(filterExpenses(expenses, filters({ datePreset: 'custom' }), NOW).map((item) => item.id)).toEqual([
      'next-year',
      'today',
      'week',
      'before-week',
      'last-month',
    ]);
  });

  it('does not throw when a custom bound cannot be parsed', () => {
    expect(() => filterExpenses(expenses, filters({ datePreset: 'custom', startDate: 'bad' }), NOW)).not.toThrow();
    expect(filterExpenses(expenses, filters({ datePreset: 'custom', startDate: 'bad' }), NOW)).toHaveLength(
      expenses.length
    );
  });

  it('separates last month, this month, and a week that crosses the new year', () => {
    const newYear = new Date(2026, 0, 1, 12, 0, 0);
    const dated = [
      expense({ id: 'before-week', date: '2025-12-28' }),
      expense({ id: 'week-start', date: '2025-12-29' }),
      expense({ id: 'year-end', date: '2025-12-31' }),
      expense({ id: 'new-year', date: '2026-01-01' }),
      expense({ id: 'week-end', date: '2026-01-04' }),
      expense({ id: 'next-week', date: '2026-01-05' }),
      expense({ id: 'month-end', date: '2026-01-31' }),
    ];

    expect(filterExpenses(dated, filters({ datePreset: 'today' }), newYear).map((item) => item.id)).toEqual([
      'new-year',
    ]);
    expect(filterExpenses(dated, filters({ datePreset: 'this_week' }), newYear).map((item) => item.id)).toEqual([
      'week-end',
      'new-year',
      'year-end',
      'week-start',
    ]);
    expect(filterExpenses(dated, filters({ datePreset: 'this_month' }), newYear).map((item) => item.id)).toEqual([
      'month-end',
      'next-week',
      'week-end',
      'new-year',
    ]);
    expect(filterExpenses(dated, filters({ datePreset: 'last_month' }), newYear).map((item) => item.id)).toEqual([
      'year-end',
      'week-start',
      'before-week',
    ]);
    expect(filterExpenses(dated, filters({ datePreset: 'this_year' }), newYear).map((item) => item.id)).toEqual([
      'month-end',
      'next-week',
      'week-end',
      'new-year',
    ]);
  });

  it('sorts calendar dates from newest to oldest and the other way around', () => {
    const dated = [
      expense({ id: 'november', date: '2026-11-13' }),
      expense({ id: 'january', date: '2026-01-01' }),
      expense({ id: 'december', date: '2026-12-31' }),
    ];

    expect(filterExpenses(dated, filters({ sortBy: 'date_asc' }), NOW).map((item) => item.id)).toEqual([
      'january',
      'november',
      'december',
    ]);
    expect(filterExpenses(dated, filters({ sortBy: 'date_desc' }), NOW).map((item) => item.id)).toEqual([
      'december',
      'november',
      'january',
    ]);
  });

  it('sorts high amounts first and keeps the earlier record when amounts match', () => {
    const dated = [
      expense({ id: 'low', amount: 5 }),
      expense({ id: 'high-first', amount: 20 }),
      expense({ id: 'high-second', amount: 20 }),
    ];

    expect(filterExpenses(dated, filters({ sortBy: 'amount_desc' }), NOW).map((item) => item.id)).toEqual([
      'high-first',
      'high-second',
      'low',
    ]);
  });

  it('keeps a record only when the search, category, amount, and date all match', () => {
    expect(
      filterExpenses(
        expenses,
        filters({
          search: 'train',
          category: 'Transportation',
          minAmount: 20,
          maxAmount: 20,
          datePreset: 'this_week',
        }),
        NOW
      ).map((item) => item.id)
    ).toEqual(['week']);
    expect(
      filterExpenses(
        expenses,
        filters({
          search: 'train',
          category: 'Food',
          minAmount: 20,
          maxAmount: 20,
          datePreset: 'this_week',
        }),
        NOW
      )
    ).toEqual([]);
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

  it('keeps a zero change when last month has no spending', () => {
    const summary = summarizeExpenses([expense({ amount: 25, date: '2026-11-01' })], NOW);

    expect(summary.thisMonthSpent).toBe(25);
    expect(summary.lastMonthSpent).toBe(0);
    expect(summary.monthlyChangePercent).toBe(0);
  });

  it('rounds category shares to one decimal and keeps the first tied category', () => {
    const summary = summarizeExpenses(
      [
        expense({ amount: 1, category: 'Food', date: '2026-11-13' }),
        expense({ amount: 2, category: 'Bills', date: '2026-11-13' }),
        expense({ amount: 10, category: 'Shopping', date: '2026-11-13' }),
        expense({ amount: 10, category: 'Transportation', date: '2026-11-13' }),
      ],
      NOW
    );

    expect(summary.categoryBreakdown.find((item) => item.category === 'Food')?.percentage).toBe(4.3);
    expect(summary.categoryBreakdown.find((item) => item.category === 'Bills')?.percentage).toBe(8.7);
    expect(summary.topCategory?.category).toBe('Transportation');
    expect(summary.categoryBreakdown.slice(0, 2).map((item) => item.category)).toEqual([
      'Transportation',
      'Shopping',
    ]);
  });

  it('counts an unrecognized category in the total without assigning it to another category', () => {
    const summary = summarizeExpenses(
      [
        expense({ amount: 10, category: 'Food', date: '2026-11-13' }),
        expense({ amount: 30, category: 'Rent' as Expense['category'], date: '2026-11-13' }),
      ],
      NOW
    );

    expect(summary.totalSpent).toBe(40);
    expect(summary.topCategory).toEqual({ category: 'Food', amount: 10, count: 1 });
    expect(summary.categoryBreakdown.find((item) => item.category === 'Food')?.percentage).toBe(25);
    expect(summary.categoryBreakdown.reduce((sum, item) => sum + item.amount, 0)).toBe(10);
  });

  it('splits a week that crosses the new year from last month and this month', () => {
    const newYear = new Date(2026, 0, 1, 12, 0, 0);
    const summary = summarizeExpenses(
      [
        expense({ amount: 4, date: '2025-12-28' }),
        expense({ amount: 5, date: '2025-12-29' }),
        expense({ amount: 6, date: '2025-12-31' }),
        expense({ amount: 7, date: '2026-01-01' }),
        expense({ amount: 8, date: '2026-01-04' }),
        expense({ amount: 9, date: '2026-01-05' }),
        expense({ amount: 10, date: '2026-01-31' }),
      ],
      newYear
    );

    expect(summary.todaySpent).toBe(7);
    expect(summary.thisWeekSpent).toBe(5 + 6 + 7 + 8);
    expect(summary.thisMonthSpent).toBe(7 + 8 + 9 + 10);
    expect(summary.lastMonthSpent).toBe(4 + 5 + 6);
    expect(summary.monthlyChangePercent).toBeCloseTo(((34 - 15) / 15) * 100, 10);
    expect(summary.totalSpent).toBe(49);
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
    expect(merged).not.toBe(existing);
    expect(existing.map((item) => item.id)).toEqual(['kept']);
    expect(imported.map((item) => item.description)).toEqual(['Imported', 'Clash']);
  });

  it('returns a new list when the import is empty', () => {
    const existing = [expense({ id: 'kept' })];
    const merged = mergeImportedExpenses(existing, []);

    merged.push(expense({ id: 'extra' }));

    expect(merged.slice(0, 1)).toEqual(existing);
    expect(merged).not.toBe(existing);
    expect(existing.map((item) => item.id)).toEqual(['kept']);
  });

  it('does not rename a repeated imported id that is new to the ledger', () => {
    const merged = mergeImportedExpenses(
      [],
      [expense({ id: 'same' }), expense({ id: 'same', description: 'Second' })],
      () => 'unused'
    );

    expect(merged.map((item) => item.id)).toEqual(['same', 'same']);
  });

  it('asks for a new id for every imported record that collides with the ledger', () => {
    let generated = 0;
    const merged = mergeImportedExpenses(
      [expense({ id: 'kept' })],
      [
        expense({ id: 'kept', description: 'First clash' }),
        expense({ id: 'kept', description: 'Second clash' }),
      ],
      () => {
        generated += 1;
        return `generated-${generated}`;
      }
    );

    expect(merged.map((item) => item.id)).toEqual(['generated-1', 'generated-2', 'kept']);
    expect(merged.map((item) => item.description)).toEqual(['First clash', 'Second clash', 'Lunch']);
  });
});

describe('hasActiveExpenseFilters', () => {
  it('treats the default filters as the full ledger', () => {
    expect(hasActiveExpenseFilters(DEFAULT_FILTERS)).toBe(false);
  });

  it('turns on for a search, category, date, amount bound, or sort that is not the default', () => {
    expect(hasActiveExpenseFilters({ ...DEFAULT_FILTERS, search: ' ' })).toBe(true);
    expect(hasActiveExpenseFilters({ ...DEFAULT_FILTERS, category: 'Food' })).toBe(true);
    expect(hasActiveExpenseFilters({ ...DEFAULT_FILTERS, datePreset: 'today' })).toBe(true);
    expect(hasActiveExpenseFilters({ ...DEFAULT_FILTERS, startDate: '2026-11-01' })).toBe(true);
    expect(hasActiveExpenseFilters({ ...DEFAULT_FILTERS, endDate: '2026-11-30' })).toBe(true);
    expect(hasActiveExpenseFilters({ ...DEFAULT_FILTERS, minAmount: 0 })).toBe(true);
    expect(hasActiveExpenseFilters({ ...DEFAULT_FILTERS, maxAmount: 0 })).toBe(true);
    expect(hasActiveExpenseFilters({ ...DEFAULT_FILTERS, sortBy: 'amount_asc' })).toBe(true);
  });
});

describe('monthlySpendingComparison', () => {
  it('has nothing to compare when this month has no spending', () => {
    expect(monthlySpendingComparison(0, 25)).toBe('none');
    expect(monthlySpendingComparison(-1, -10)).toBe('none');
  });

  it('separates a drop, a rise, and an unchanged month', () => {
    expect(monthlySpendingComparison(80, -12.5)).toBe('lower');
    expect(monthlySpendingComparison(80, 0.1)).toBe('higher');
    expect(monthlySpendingComparison(80, 0)).toBe('unchanged');
  });
});

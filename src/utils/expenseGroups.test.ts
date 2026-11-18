import { describe, expect, it } from 'vitest';
import { Expense } from '@/types/expense';
import { groupExpensesByDate, selectRecentExpenses } from '@/utils/expenseGroups';
import { formatCurrency } from '@/utils/formatters';

function record(id: string, date: string, amount: number): Expense {
  return {
    id,
    description: id,
    amount,
    category: 'Food',
    date,
    createdAt: '2026-11-13T00:00:00.000Z',
    updatedAt: '2026-11-13T00:00:00.000Z',
  };
}

describe('groupExpensesByDate', () => {
  it('returns no groups for an empty list', () => {
    expect(groupExpensesByDate([])).toEqual([]);
  });

  it('keeps the first date it sees, joins later records into that group, and sums the day', () => {
    const firstNovember = record('rent', '2026-11-12', 50);
    const laterNovember = record('coffee', '2026-11-13', 4);
    const secondNovember = record('snack', '2026-11-12', 5);
    const expenses = [firstNovember, laterNovember, secondNovember];

    const groups = groupExpensesByDate(expenses);

    expect(groups).toEqual([
      {
        date: '2026-11-12',
        expenses: [firstNovember, secondNovember],
        total: 55,
      },
      {
        date: '2026-11-13',
        expenses: [laterNovember],
        total: 4,
      },
    ]);
    expect(expenses.map((item) => item.id)).toEqual(['rent', 'coffee', 'snack']);
  });

  it('still shows thirty cents when two amounts on the same day cannot be stored exactly', () => {
    const groups = groupExpensesByDate([
      record('first', '2026-11-12', 0.1),
      record('second', '2026-11-12', 0.2),
    ]);

    expect(groups).toHaveLength(1);
    expect(formatCurrency(groups[0].total)).toBe('$0.30');
    expect(groups[0].expenses.map((item) => item.id)).toEqual(['first', 'second']);
  });
});

describe('selectRecentExpenses', () => {
  it('returns nothing when the ledger is empty', () => {
    expect(selectRecentExpenses([])).toEqual([]);
  });

  it('keeps every record when there are five or fewer, newest calendar date first', () => {
    const older = record('older', '2026-11-01', 1);
    const newer = record('newer', '2026-11-12', 2);
    const sameDayFirst = record('same-first', '2026-11-12', 3);
    const list = [older, newer, sameDayFirst];

    expect(selectRecentExpenses(list).map((item) => item.id)).toEqual([
      'newer',
      'same-first',
      'older',
    ]);
    expect(list.map((item) => item.id)).toEqual(['older', 'newer', 'same-first']);
  });

  it('drops the oldest records once the list is longer than five', () => {
    const expenses = [
      record('sixth', '2026-11-01', 1),
      record('fifth', '2026-11-02', 1),
      record('fourth', '2026-11-03', 1),
      record('third', '2026-11-04', 1),
      record('second', '2026-11-05', 1),
      record('first', '2026-11-06', 1),
    ];

    expect(selectRecentExpenses(expenses).map((item) => item.id)).toEqual([
      'first',
      'second',
      'third',
      'fourth',
      'fifth',
    ]);
  });
});

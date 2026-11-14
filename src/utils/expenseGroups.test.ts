import { describe, expect, it } from 'vitest';
import { Expense } from '@/types/expense';
import { groupExpensesByDate } from '@/utils/expenseGroups';

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
});

import { describe, expect, it } from 'vitest';
import { Expense, ExpenseFormData } from '@/types/expense';
import {
  createExpense,
  deleteExpenseFromList,
  prependExpense,
  updateExpenseInList,
} from '@/utils/expenseLedger';

function form(overrides: Partial<ExpenseFormData> = {}): ExpenseFormData {
  return {
    description: 'Lunch',
    amount: 12.5,
    category: 'Food',
    date: '2026-11-13',
    paymentMethod: 'Cash',
    notes: 'soup',
    ...overrides,
  };
}

function record(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'exp-1',
    description: 'Lunch',
    amount: 12.5,
    category: 'Food',
    date: '2026-11-13',
    paymentMethod: 'Cash',
    notes: 'soup',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('createExpense', () => {
  it('copies the form and stamps the same time on createdAt and updatedAt', () => {
    const data = form();
    const created = createExpense(data, 'exp-new', '2026-11-13T10:00:00.000Z');

    expect(created).toEqual({
      description: 'Lunch',
      amount: 12.5,
      category: 'Food',
      date: '2026-11-13',
      paymentMethod: 'Cash',
      notes: 'soup',
      id: 'exp-new',
      createdAt: '2026-11-13T10:00:00.000Z',
      updatedAt: '2026-11-13T10:00:00.000Z',
    });
    expect(created).not.toBe(data);
  });
});

describe('prependExpense', () => {
  it('puts the new record first and does not mutate the old array', () => {
    const existing = [record({ id: 'older' })];
    const added = record({ id: 'newer' });
    const next = prependExpense(existing, added);

    expect(next.map((item) => item.id)).toEqual(['newer', 'older']);
    expect(existing.map((item) => item.id)).toEqual(['older']);
    expect(next[1]).toBe(existing[0]);
  });
});

describe('updateExpenseInList', () => {
  it('replaces the matching record, keeps its id and created time, and clears notes when the form omits them', () => {
    const original = record({ id: 'keep', notes: 'old note' });
    const other = record({ id: 'other', description: 'Train', amount: 20, category: 'Transportation' });
    const list = [original, other];

    const result = updateExpenseInList(
      list,
      'keep',
      form({
        description: 'Dinner',
        amount: 18,
        category: 'Entertainment',
        date: '2026-11-14',
        paymentMethod: 'Credit Card',
        notes: undefined,
      }),
      '2026-11-14T08:00:00.000Z'
    );

    expect(result.updated).toBe(true);
    expect(result.expenses).not.toBe(list);
    expect(result.expenses[1]).toBe(other);
    expect(result.expenses[0]).toEqual({
      id: 'keep',
      description: 'Dinner',
      amount: 18,
      category: 'Entertainment',
      date: '2026-11-14',
      paymentMethod: 'Credit Card',
      notes: undefined,
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-14T08:00:00.000Z',
    });
    expect(original.description).toBe('Lunch');
    expect(original.notes).toBe('old note');
  });

  it('returns the same list when the id is missing', () => {
    const list = [record()];
    const result = updateExpenseInList(list, 'missing', form(), '2026-11-14T08:00:00.000Z');

    expect(result.updated).toBe(false);
    expect(result.expenses).toBe(list);
  });
});

describe('deleteExpenseFromList', () => {
  it('removes the matching record and keeps the surrounding records in order', () => {
    const first = record({ id: 'a', amount: 1 });
    const middle = record({ id: 'b', amount: 2 });
    const last = record({ id: 'c', amount: 3 });
    const list = [first, middle, last];

    const result = deleteExpenseFromList(list, 'b');

    expect(result.deleted).toBe(true);
    expect(result.expenses).toEqual([first, last]);
    expect(result.expenses[0]).toBe(first);
    expect(result.expenses[1]).toBe(last);
    expect(list.map((item) => item.id)).toEqual(['a', 'b', 'c']);
  });

  it('removes every copy when the same id was stored more than once', () => {
    const first = record({ id: 'a' });
    const duplicate = record({ id: 'b', description: 'First copy' });
    const secondCopy = record({ id: 'b', description: 'Second copy' });
    const last = record({ id: 'c' });

    const result = deleteExpenseFromList([first, duplicate, secondCopy, last], 'b');

    expect(result.deleted).toBe(true);
    expect(result.expenses.map((item) => item.id)).toEqual(['a', 'c']);
  });

  it('returns the same list when nothing matches', () => {
    const list = [record()];
    const result = deleteExpenseFromList(list, 'missing');

    expect(result.deleted).toBe(false);
    expect(result.expenses).toBe(list);
  });
});

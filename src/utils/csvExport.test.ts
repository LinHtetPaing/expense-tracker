import { describe, expect, it } from 'vitest';
import { Expense } from '@/types/expense';
import { buildExpensesCsv, parseJSONExpensesFile } from '@/utils/csvExport';

function expense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'exp-1',
    description: 'Lunch',
    amount: 10.5,
    category: 'Food',
    date: '2026-11-13',
    paymentMethod: 'Cash',
    notes: 'salad',
    createdAt: '2026-11-13T12:00:00.000Z',
    updatedAt: '2026-11-13T12:00:00.000Z',
    ...overrides,
  };
}

function jsonFile(value: unknown): File {
  return new File([typeof value === 'string' ? value : JSON.stringify(value)], 'expenses.json', {
    type: 'application/json',
  });
}

describe('buildExpensesCsv', () => {
  it('refuses to build a file with no rows', () => {
    expect(() => buildExpensesCsv([])).toThrow('No expenses to export.');
  });

  it('quotes commas and doubled quotes, and fills a missing payment method', () => {
    const csv = buildExpensesCsv([
      expense({
        description: 'Cafe, "Main"',
        amount: 3.5,
        paymentMethod: undefined,
        notes: undefined,
      }),
    ]);

    const [header, row] = csv.split('\r\n');
    expect(header).toBe('ID,Date,Description,Category,Amount,Payment Method,Notes,Created At');
    expect(row).toBe(
      '"exp-1","2026-11-13","Cafe, ""Main""","Food",3.50,"N/A","","2026-11-13T12:00:00.000Z"'
    );
  });
});

describe('parseJSONExpensesFile', () => {
  const valid = {
    id: 'backup-1',
    description: '  Groceries  ',
    amount: '12.345',
    category: 'Food',
    date: '2026-11-13T15:00:00.000Z',
    paymentMethod: 'Cash',
    notes: '  fruit  ',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-02T00:00:00.000Z',
  };

  it('normalizes a valid backup record', async () => {
    const [imported] = await parseJSONExpensesFile(jsonFile([valid]));

    expect(imported).toMatchObject({
      id: 'backup-1',
      description: 'Groceries',
      amount: 12.35,
      category: 'Food',
      date: '2026-11-13',
      paymentMethod: 'Cash',
      notes: 'fruit',
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-02T00:00:00.000Z',
    });
  });

  it('drops an unknown payment method and still assigns an id when one is missing', async () => {
    const [imported] = await parseJSONExpensesFile(
      jsonFile([{ ...valid, id: undefined, paymentMethod: 'Bitcoin', notes: 12 }])
    );

    expect(imported.id.startsWith('exp-import-')).toBe(true);
    expect(imported.paymentMethod).toBeUndefined();
    expect(imported.notes).toBeUndefined();
  });

  it('rejects a file that is not a list of expenses', async () => {
    await expect(parseJSONExpensesFile(jsonFile({ expenses: [] }))).rejects.toThrow(
      'Invalid JSON file format. Expected an array of expenses.'
    );
    await expect(parseJSONExpensesFile(jsonFile('not json'))).rejects.toThrow();
  });

  it('rejects the whole file when any record has a bad description, amount, category, or date', async () => {
    await expect(parseJSONExpensesFile(jsonFile([{ ...valid, description: '' }]))).rejects.toThrow(
      'Item 1: Missing or invalid description'
    );
    await expect(parseJSONExpensesFile(jsonFile([valid, { ...valid, amount: 0 }]))).rejects.toThrow(
      'Item 2: Invalid amount'
    );
    await expect(parseJSONExpensesFile(jsonFile([{ ...valid, amount: -1 }]))).rejects.toThrow(
      'Item 1: Invalid amount'
    );
    await expect(parseJSONExpensesFile(jsonFile([{ ...valid, category: 'Rent' }]))).rejects.toThrow(
      'Item 1: Invalid category (Rent)'
    );
    await expect(parseJSONExpensesFile(jsonFile([{ ...valid, date: 'soon' }]))).rejects.toThrow(
      'Item 1: Invalid date'
    );
  });
});

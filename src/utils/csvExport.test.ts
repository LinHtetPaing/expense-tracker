import { afterEach, describe, expect, it, vi } from 'vitest';
import { format } from 'date-fns';
import { Expense } from '@/types/expense';
import {
  buildExpensesCsv,
  expenseExportSelection,
  exportExpensesToCSV,
  exportExpensesToJSON,
  parseJSONExpensesFile,
} from '@/utils/csvExport';

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

describe('expenseExportSelection', () => {
  it('keeps a spreadsheet on the chosen rows and a backup on the full ledger', () => {
    const allExpenses = [expense({ id: 'rent', amount: 40 }), expense({ id: 'coffee', amount: 4 })];
    const filteredExpenses = [allExpenses[1]];

    expect(expenseExportSelection('all', allExpenses, filteredExpenses)).toEqual({
      csvExpenses: allExpenses,
      csvFilenamePrefix: 'expenses',
      jsonExpenses: allExpenses,
    });
    expect(expenseExportSelection('filtered', allExpenses, filteredExpenses)).toEqual({
      csvExpenses: filteredExpenses,
      csvFilenamePrefix: 'expenses_filtered',
      jsonExpenses: allExpenses,
    });
  });

  it('still backs up the full ledger when the filtered spreadsheet would be empty', () => {
    const allExpenses = [expense()];

    expect(expenseExportSelection('filtered', allExpenses, [])).toEqual({
      csvExpenses: [],
      csvFilenamePrefix: 'expenses_filtered',
      jsonExpenses: allExpenses,
    });
  });
});

describe('buildExpensesCsv', () => {
  it('refuses to build a file with no rows', () => {
    expect(() => buildExpensesCsv([])).toThrow('No expenses to export.');
    expect(() => buildExpensesCsv(undefined as unknown as Expense[])).toThrow('No expenses to export.');
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

  it('writes spreadsheet cents with number formatting that can differ from the cents stored on import', () => {
    const csv = buildExpensesCsv([
      expense({
        id: 'half-up',
        amount: 2.675,
        paymentMethod: undefined,
        notes: undefined,
      }),
      expense({
        id: 'short',
        amount: 1.005,
        paymentMethod: undefined,
        notes: undefined,
      }),
    ]);
    const rows = csv.split('\r\n').slice(1);

    expect(rows[0]).toContain(',2.67,');
    expect(rows[1]).toContain(',1.00,');
  });

  it('keeps a line break inside one quoted notes field and writes later rows after it', () => {
    const csv = buildExpensesCsv([
      expense({
        id: 'first',
        amount: 1,
        notes: 'line1\nline2',
        paymentMethod: undefined,
      }),
      expense({
        id: 'second',
        amount: 2,
        description: 'Next',
      }),
    ]);

    const lines = csv.replace('line1\nline2', 'line1line2').split('\r\n');
    expect(lines).toHaveLength(3);
    expect(lines[1].startsWith('"first"')).toBe(true);
    expect(lines[1]).toContain(',1.00,');
    expect(lines[2].startsWith('"second"')).toBe(true);
    expect(csv).toContain('"line1\nline2"');
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

  it('accepts an empty backup and drops fields this app does not store', async () => {
    await expect(parseJSONExpensesFile(jsonFile([]))).resolves.toEqual([]);

    const [imported] = await parseJSONExpensesFile(
      jsonFile([{ ...valid, receiptUrl: 'https://example.test' }])
    );

    expect(imported).not.toHaveProperty('receiptUrl');
    expect(imported.description).toBe('Groceries');
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
    await expect(parseJSONExpensesFile(jsonFile([{ ...valid, amount: 'twelve' }]))).rejects.toThrow(
      'Item 1: Invalid amount'
    );
    await expect(parseJSONExpensesFile(jsonFile([{ ...valid, amount: null }]))).rejects.toThrow(
      'Item 1: Invalid amount'
    );
    await expect(parseJSONExpensesFile(jsonFile([{ ...valid, description: 12 }]))).rejects.toThrow(
      'Item 1: Missing or invalid description'
    );
    await expect(parseJSONExpensesFile(jsonFile([{ ...valid, category: 'food' }]))).rejects.toThrow(
      'Item 1: Invalid category (food)'
    );
    await expect(parseJSONExpensesFile(jsonFile([{ ...valid, date: '' }]))).rejects.toThrow(
      'Item 1: Invalid date'
    );
  });

  it('stores a fraction of a cent as zero or one cent and trims a blank description', async () => {
    const [tiny, half, blank, spreadsheetCents] = await parseJSONExpensesFile(
      jsonFile([
        { ...valid, id: 'tiny', amount: 0.004 },
        { ...valid, id: 'half', amount: '0.005' },
        { ...valid, id: 'blank', description: '   ' },
        { ...valid, id: 'cents', amount: 2.675 },
      ])
    );

    expect(tiny.amount).toBe(0);
    expect(half.amount).toBe(0.01);
    expect(blank.description).toBe('');
    expect(spreadsheetCents.amount).toBe(2.68);
  });

  it('fills a missing timestamp from the clock, rounds half a cent, and drops an unknown payment method', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-15T01:02:03.000Z'));
    try {
      const [imported] = await parseJSONExpensesFile(
        jsonFile([
          {
            ...valid,
            id: '',
            amount: '10.995',
            paymentMethod: 'cash',
            notes: '   ',
            updatedAt: undefined,
          },
        ])
      );

      expect(imported.id).toBe('exp-import-1794704523000-0');
      expect(imported.amount).toBe(11);
      expect(imported.paymentMethod).toBeUndefined();
      expect(imported.notes).toBe('');
      expect(imported.createdAt).toBe('2026-11-01T00:00:00.000Z');
      expect(imported.updatedAt).toBe('2026-11-15T01:02:03.000Z');
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('expense file downloads', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  function installDownload() {
    const order: string[] = [];
    const created: Array<{ attrs: Record<string, string>; click: ReturnType<typeof vi.fn> }> = [];
    const attached: unknown[] = [];
    const blobs: Blob[] = [];
    const revoke = vi.fn((url: string) => {
      order.push(`revoke:${url}`);
    });

    vi.stubGlobal('document', {
      createElement: () => {
        const attrs: Record<string, string> = {};
        const node = {
          attrs,
          setAttribute(name: string, value: string) {
            attrs[name] = value;
          },
          click: vi.fn(() => {
            order.push('click');
          }),
        };
        created.push(node);
        return node;
      },
      body: {
        appendChild(node: unknown) {
          attached.push(node);
          order.push('append');
        },
        removeChild(node: unknown) {
          const index = attached.indexOf(node);
          if (index === -1) throw new Error('link was not attached');
          attached.splice(index, 1);
          order.push('remove');
        },
      },
    });
    vi.stubGlobal('URL', {
      createObjectURL: (blob: Blob) => {
        blobs.push(blob);
        return `blob:expense-${blobs.length}`;
      },
      revokeObjectURL: revoke,
    });

    return { order, created, attached, blobs, revoke };
  }

  it('downloads a spreadsheet named with the prefix and the current minute, then removes the link', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-16T01:05:30.000Z'));
    const download = installDownload();
    const rows = [expense({ amount: 10.5 }), expense({ id: 'exp-2', amount: 2 })];

    exportExpensesToCSV(rows, 'expenses_filtered');

    const stamp = format(new Date(), 'yyyy-MM-dd_HHmm');
    expect(download.created).toHaveLength(1);
    expect(download.created[0].attrs).toEqual({
      href: 'blob:expense-1',
      download: `expenses_filtered_${stamp}.csv`,
    });
    expect(download.created[0].click).toHaveBeenCalledOnce();
    expect(download.order).toEqual(['append', 'click', 'remove', 'revoke:blob:expense-1']);
    expect(download.attached).toEqual([]);
    expect(download.blobs[0].type).toBe('text/csv;charset=utf-8;');
    await expect(download.blobs[0].text()).resolves.toBe(buildExpensesCsv(rows));
  });

  it('uses the default spreadsheet prefix when none is given', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-16T01:05:30.000Z'));
    const download = installDownload();

    exportExpensesToCSV([expense()]);

    const stamp = format(new Date(), 'yyyy-MM-dd_HHmm');
    expect(download.created[0].attrs.download).toBe(`expenses_${stamp}.csv`);
  });

  it('does not start a download when there are no rows to export', () => {
    const download = installDownload();

    expect(() => exportExpensesToCSV([])).toThrow('No expenses to export.');
    expect(download.created).toEqual([]);
    expect(download.blobs).toEqual([]);
    expect(download.revoke).not.toHaveBeenCalled();
  });

  it('downloads a pretty backup of the ledger and still writes an empty list', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-16T01:05:30.000Z'));
    const rows = [expense({ notes: 'line\n"quoted"' })];
    const download = installDownload();

    exportExpensesToJSON(rows);

    const stamp = format(new Date(), 'yyyy-MM-dd_HHmm');
    expect(download.created[0].attrs.download).toBe(`expense_tracker_backup_${stamp}.json`);
    expect(download.blobs[0].type).toBe('application/json');
    await expect(download.blobs[0].text()).resolves.toBe(JSON.stringify(rows, null, 2));
    expect(download.order).toEqual(['append', 'click', 'remove', 'revoke:blob:expense-1']);

    exportExpensesToJSON([]);
    await expect(download.blobs[1].text()).resolves.toBe('[]');
    expect(download.created[1].attrs.download).toBe(`expense_tracker_backup_${stamp}.json`);
  });
});

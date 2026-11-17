import { Category, CATEGORIES, Expense, PaymentMethod, PAYMENT_METHODS } from '@/types/expense';
import { format } from 'date-fns';

export type ExpenseExportScope = 'all' | 'filtered';

export interface ExpenseExportSelection {
  csvExpenses: Expense[];
  csvFilenamePrefix: string;
  jsonExpenses: Expense[];
}

export function expenseExportSelection(
  scope: ExpenseExportScope,
  allExpenses: Expense[],
  filteredExpenses: Expense[]
): ExpenseExportSelection {
  return {
    csvExpenses: scope === 'filtered' ? filteredExpenses : allExpenses,
    csvFilenamePrefix: scope === 'filtered' ? 'expenses_filtered' : 'expenses',
    jsonExpenses: allExpenses,
  };
}

export function buildExpensesCsv(expenses: Expense[]): string {
  if (!expenses || expenses.length === 0) {
    throw new Error('No expenses to export.');
  }

  const headers = ['ID', 'Date', 'Description', 'Category', 'Amount', 'Payment Method', 'Notes', 'Created At'];

  const escapeCSV = (value: string | number | undefined | null) => {
    if (value === undefined || value === null) return '""';
    const str = String(value);
    // Escape double quotes by doubling them
    return `"${str.replace(/"/g, '""')}"`;
  };

  const rows = expenses.map((exp) => [
    escapeCSV(exp.id),
    escapeCSV(exp.date),
    escapeCSV(exp.description),
    escapeCSV(exp.category),
    exp.amount.toFixed(2),
    escapeCSV(exp.paymentMethod || 'N/A'),
    escapeCSV(exp.notes || ''),
    escapeCSV(exp.createdAt),
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
}

export function exportExpensesToCSV(expenses: Expense[], filenamePrefix: string = 'expenses'): void {
  const csvContent = buildExpensesCsv(expenses);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = format(new Date(), 'yyyy-MM-dd_HHmm');
  link.setAttribute('download', `${filenamePrefix}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportExpensesToJSON(expenses: Expense[]): void {
  const jsonStr = JSON.stringify(expenses, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = format(new Date(), 'yyyy-MM-dd_HHmm');
  link.setAttribute('download', `expense_tracker_backup_${dateStr}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function parseJSONExpensesFile(file: File): Promise<Expense[]> {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) {
    throw new Error('Invalid JSON file format. Expected an array of expenses.');
  }

  // Validate each record
  const validated: Expense[] = parsed.map((item, idx) => {
    if (!item.description || typeof item.description !== 'string') {
      throw new Error(`Item ${idx + 1}: Missing or invalid description`);
    }
    const amount = Number(item.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error(`Item ${idx + 1}: Invalid amount`);
    }
    if (!item.category || !CATEGORIES.includes(item.category as Category)) {
      throw new Error(`Item ${idx + 1}: Invalid category (${item.category})`);
    }
    if (!item.date || isNaN(Date.parse(item.date))) {
      throw new Error(`Item ${idx + 1}: Invalid date`);
    }

    return {
      id: item.id || `exp-import-${Date.now()}-${idx}`,
      description: item.description.trim(),
      amount: Math.round(amount * 100) / 100,
      category: item.category as Category,
      date: item.date.slice(0, 10),
      paymentMethod: PAYMENT_METHODS.includes(item.paymentMethod) ? (item.paymentMethod as PaymentMethod) : undefined,
      notes: typeof item.notes === 'string' ? item.notes.trim() : undefined,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString(),
    };
  });

  return validated;
}

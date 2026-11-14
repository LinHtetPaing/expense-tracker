import { Expense } from '@/types/expense';

export interface ExpenseDateGroup {
  date: string;
  expenses: Expense[];
  total: number;
}

export function groupExpensesByDate(expenses: Expense[]): ExpenseDateGroup[] {
  const map = new Map<string, Expense[]>();

  expenses.forEach((item) => {
    const existing = map.get(item.date) || [];
    existing.push(item);
    map.set(item.date, existing);
  });

  return Array.from(map.entries()).map(([date, items]) => ({
    date,
    expenses: items,
    total: items.reduce((sum, item) => sum + item.amount, 0),
  }));
}

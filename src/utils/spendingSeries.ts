import { Category, Expense } from '@/types/expense';
import { format, subDays, startOfMonth, subMonths } from 'date-fns';
import { CATEGORY_CONFIG } from './constants';

export interface DailySpendingPoint {
  dateStr: string;
  label: string;
  amount: number;
  count: number;
}

export interface MonthlySpendingPoint {
  monthStr: string;
  label: string;
  amount: number;
  count: number;
}

export function buildDailySpendingTrend(
  expenses: Expense[],
  now: Date = new Date()
): DailySpendingPoint[] {
  const today = new Date(now);
  const days: DailySpendingPoint[] = [];

  for (let i = 13; i >= 0; i--) {
    const day = subDays(today, i);
    const dateStr = format(day, 'yyyy-MM-dd');
    const label = format(day, 'MMM d');

    const dayExpenses = expenses.filter((expense) => expense.date === dateStr);
    const totalAmount = dayExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    days.push({
      dateStr,
      label,
      amount: Math.round(totalAmount * 100) / 100,
      count: dayExpenses.length,
    });
  }

  return days;
}

export function buildMonthlySpending(
  expenses: Expense[],
  now: Date = new Date()
): MonthlySpendingPoint[] {
  const today = new Date(now);
  const months: MonthlySpendingPoint[] = [];

  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(today, i);
    const monthStart = startOfMonth(monthDate);
    const monthPrefix = format(monthStart, 'yyyy-MM');
    const label = format(monthStart, 'MMM yyyy');

    const monthExpenses = expenses.filter((expense) => expense.date.startsWith(monthPrefix));
    const totalAmount = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    months.push({
      monthStr: monthPrefix,
      label,
      amount: Math.round(totalAmount * 100) / 100,
      count: monthExpenses.length,
    });
  }

  return months;
}

export interface CategoryChartPoint {
  name: Category;
  value: number;
  percentage: number;
  count: number;
  color: string;
}

export function buildCategoryChartPoints(
  breakdown: Array<{
    category: Category;
    amount: number;
    count: number;
    percentage: number;
  }>
): CategoryChartPoint[] {
  return breakdown
    .filter((item) => item.amount > 0)
    .map((item) => ({
      name: item.category,
      value: item.amount,
      percentage: item.percentage,
      count: item.count,
      color: CATEGORY_CONFIG[item.category]?.hexColor || '#64748b',
    }));
}

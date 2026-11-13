import {
  Category,
  CATEGORIES,
  Expense,
  ExpenseFilters,
  SpendingSummary,
} from '@/types/expense';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  isWithinInterval,
  isSameDay,
} from 'date-fns';

function startOfLocalDay(now: Date): Date {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return today;
}

export function filterExpenses(
  expenses: Expense[],
  filters: ExpenseFilters,
  now: Date = new Date()
): Expense[] {
  const today = startOfLocalDay(now);

  return expenses.filter((expense) => {
    if (filters.search.trim()) {
      const query = filters.search.toLowerCase().trim();
      const matchesDesc = expense.description.toLowerCase().includes(query);
      const matchesNotes = expense.notes?.toLowerCase().includes(query) || false;
      const matchesCategory = expense.category.toLowerCase().includes(query);
      const matchesMethod = expense.paymentMethod?.toLowerCase().includes(query) || false;

      if (!matchesDesc && !matchesNotes && !matchesCategory && !matchesMethod) {
        return false;
      }
    }

    if (filters.category !== 'all' && expense.category !== filters.category) {
      return false;
    }

    if (filters.minAmount !== undefined && expense.amount < filters.minAmount) {
      return false;
    }
    if (filters.maxAmount !== undefined && expense.amount > filters.maxAmount) {
      return false;
    }

    if (filters.datePreset !== 'all') {
      const [year, month, day] = expense.date.split('-').map(Number);
      if (!year || !month || !day) return false;
      const expDate = new Date(year, month - 1, day);
      expDate.setHours(0, 0, 0, 0);

      if (filters.datePreset === 'today') {
        if (!isSameDay(expDate, today)) return false;
      } else if (filters.datePreset === 'this_week') {
        const start = startOfWeek(today, { weekStartsOn: 1 });
        const end = endOfWeek(today, { weekStartsOn: 1 });
        if (!isWithinInterval(expDate, { start, end })) return false;
      } else if (filters.datePreset === 'this_month') {
        const start = startOfMonth(today);
        const end = endOfMonth(today);
        if (!isWithinInterval(expDate, { start, end })) return false;
      } else if (filters.datePreset === 'last_month') {
        const prevMonthDate = subMonths(today, 1);
        const start = startOfMonth(prevMonthDate);
        const end = endOfMonth(prevMonthDate);
        if (!isWithinInterval(expDate, { start, end })) return false;
      } else if (filters.datePreset === 'this_year') {
        const start = startOfYear(today);
        const end = endOfYear(today);
        if (!isWithinInterval(expDate, { start, end })) return false;
      } else if (filters.datePreset === 'custom') {
        if (filters.startDate) {
          const [sYear, sMonth, sDay] = filters.startDate.split('-').map(Number);
          const start = new Date(sYear, sMonth - 1, sDay);
          start.setHours(0, 0, 0, 0);
          if (expDate < start) return false;
        }
        if (filters.endDate) {
          const [eYear, eMonth, eDay] = filters.endDate.split('-').map(Number);
          const end = new Date(eYear, eMonth - 1, eDay);
          end.setHours(23, 59, 59, 999);
          if (expDate > end) return false;
        }
      }
    }

    return true;
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case 'date_desc':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'date_asc':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'amount_desc':
        return b.amount - a.amount;
      case 'amount_asc':
        return a.amount - b.amount;
      case 'description_asc':
        return a.description.localeCompare(b.description);
      default:
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });
}

export function summarizeExpenses(
  expenses: Expense[],
  now: Date = new Date()
): SpendingSummary {
  const today = startOfLocalDay(now);

  const thisMonthStart = startOfMonth(today);
  const thisMonthEnd = endOfMonth(today);

  const lastMonthDate = subMonths(today, 1);
  const lastMonthStart = startOfMonth(lastMonthDate);
  const lastMonthEnd = endOfMonth(lastMonthDate);

  const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const thisWeekEnd = endOfWeek(today, { weekStartsOn: 1 });

  let totalSpent = 0;
  let thisMonthSpent = 0;
  let lastMonthSpent = 0;
  let thisWeekSpent = 0;
  let todaySpent = 0;

  const categoryMap: Record<Category, { amount: number; count: number }> = {
    Food: { amount: 0, count: 0 },
    Transportation: { amount: 0, count: 0 },
    Entertainment: { amount: 0, count: 0 },
    Shopping: { amount: 0, count: 0 },
    Bills: { amount: 0, count: 0 },
    Other: { amount: 0, count: 0 },
  };

  expenses.forEach((expense) => {
    totalSpent += expense.amount;

    const [year, month, day] = expense.date.split('-').map(Number);
    if (year && month && day) {
      const expDate = new Date(year, month - 1, day);
      expDate.setHours(0, 0, 0, 0);

      if (isWithinInterval(expDate, { start: thisMonthStart, end: thisMonthEnd })) {
        thisMonthSpent += expense.amount;
      }

      if (isWithinInterval(expDate, { start: lastMonthStart, end: lastMonthEnd })) {
        lastMonthSpent += expense.amount;
      }

      if (isWithinInterval(expDate, { start: thisWeekStart, end: thisWeekEnd })) {
        thisWeekSpent += expense.amount;
      }

      if (isSameDay(expDate, today)) {
        todaySpent += expense.amount;
      }
    }

    if (categoryMap[expense.category]) {
      categoryMap[expense.category].amount += expense.amount;
      categoryMap[expense.category].count += 1;
    }
  });

  const categoryBreakdown = CATEGORIES.map((cat) => {
    const data = categoryMap[cat] || { amount: 0, count: 0 };
    const percentage = totalSpent > 0 ? (data.amount / totalSpent) * 100 : 0;
    return {
      category: cat,
      amount: data.amount,
      count: data.count,
      percentage: Math.round(percentage * 10) / 10,
    };
  }).sort((a, b) => b.amount - a.amount);

  const topCategory =
    categoryBreakdown.length > 0 && categoryBreakdown[0].amount > 0
      ? {
          category: categoryBreakdown[0].category,
          amount: categoryBreakdown[0].amount,
          count: categoryBreakdown[0].count,
        }
      : null;

  let monthlyChangePercent = 0;
  if (lastMonthSpent > 0) {
    monthlyChangePercent = ((thisMonthSpent - lastMonthSpent) / lastMonthSpent) * 100;
  }

  const averageExpense = expenses.length > 0 ? totalSpent / expenses.length : 0;

  return {
    totalSpent,
    thisMonthSpent,
    lastMonthSpent,
    monthlyChangePercent,
    thisWeekSpent,
    todaySpent,
    averageExpense,
    totalCount: expenses.length,
    topCategory,
    categoryBreakdown,
  };
}

export function mergeImportedExpenses(
  existing: Expense[],
  imported: Expense[],
  createId: () => string = () =>
    `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
): Expense[] {
  const existingIds = new Set(existing.map((expense) => expense.id));
  const newItems = imported.map((item) => ({
    ...item,
    id: existingIds.has(item.id) ? createId() : item.id,
  }));

  return [...newItems, ...existing];
}

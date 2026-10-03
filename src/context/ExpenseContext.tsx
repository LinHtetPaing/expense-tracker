'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  BudgetSettings,
  Category,
  CATEGORIES,
  CurrencyCode,
  Expense,
  ExpenseFilters,
  ExpenseFormData,
  SpendingSummary,
} from '@/types/expense';
import { DEFAULT_BUDGET, DEFAULT_FILTERS } from '@/utils/constants';
import {
  clearAllExpenseData,
  getStoredBudget,
  getStoredCurrency,
  getStoredExpenses,
  resetToSampleData,
  saveStoredBudget,
  saveStoredCurrency,
  saveStoredExpenses,
} from '@/utils/storage';
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

interface ExpenseContextType {
  expenses: Expense[];
  filteredExpenses: Expense[];
  filters: ExpenseFilters;
  currency: CurrencyCode;
  budget: BudgetSettings;
  summary: SpendingSummary;
  isLoading: boolean;
  
  // Actions
  addExpense: (data: ExpenseFormData) => Expense;
  updateExpense: (id: string, data: ExpenseFormData) => boolean;
  deleteExpense: (id: string) => boolean;
  setFilters: React.Dispatch<React.SetStateAction<ExpenseFilters>>;
  updateFilterField: <K extends keyof ExpenseFilters>(field: K, value: ExpenseFilters[K]) => void;
  resetFilters: () => void;
  setCurrency: (currency: CurrencyCode) => void;
  updateBudget: (budget: BudgetSettings) => void;
  resetToSample: () => void;
  clearAllData: () => void;
  importExpenses: (imported: Expense[]) => void;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filters, setFilters] = useState<ExpenseFilters>(DEFAULT_FILTERS);
  const [currency, setCurrencyState] = useState<CurrencyCode>('USD');
  const [budget, setBudgetState] = useState<BudgetSettings>(DEFAULT_BUDGET);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const storedExpenses = getStoredExpenses();
      const storedCurrency = getStoredCurrency();
      const storedBudget = getStoredBudget();

      setExpenses(storedExpenses);
      setCurrencyState(storedCurrency);
      setBudgetState(storedBudget);
    } catch (err) {
      console.error('Failed to initialize expense state:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save changes to localStorage
  const saveExpenses = useCallback((newExpenses: Expense[]) => {
    setExpenses(newExpenses);
    saveStoredExpenses(newExpenses);
  }, []);

  const setCurrency = useCallback((newCurrency: CurrencyCode) => {
    setCurrencyState(newCurrency);
    saveStoredCurrency(newCurrency);
  }, []);

  const updateBudget = useCallback((newBudget: BudgetSettings) => {
    setBudgetState(newBudget);
    saveStoredBudget(newBudget);
  }, []);

  const addExpense = useCallback(
    (data: ExpenseFormData): Expense => {
      const now = new Date().toISOString();
      const newExpense: Expense = {
        ...data,
        id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: now,
        updatedAt: now,
      };

      saveExpenses([newExpense, ...expenses]);
      return newExpense;
    },
    [expenses, saveExpenses]
  );

  const updateExpense = useCallback(
    (id: string, data: ExpenseFormData): boolean => {
      const index = expenses.findIndex((e) => e.id === id);
      if (index === -1) return false;

      const updatedList = [...expenses];
      updatedList[index] = {
        ...updatedList[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };

      saveExpenses(updatedList);
      return true;
    },
    [expenses, saveExpenses]
  );

  const deleteExpense = useCallback(
    (id: string): boolean => {
      const filtered = expenses.filter((e) => e.id !== id);
      if (filtered.length === expenses.length) return false;
      saveExpenses(filtered);
      return true;
    },
    [expenses, saveExpenses]
  );

  const resetToSample = useCallback(() => {
    const samples = resetToSampleData();
    setExpenses(samples);
  }, []);

  const clearAllData = useCallback(() => {
    clearAllExpenseData();
    setExpenses([]);
  }, []);

  const importExpenses = useCallback(
    (imported: Expense[]) => {
      // Merge with existing avoiding exact ID collisions
      const existingIds = new Set(expenses.map((e) => e.id));
      const newItems = imported.map((item) => ({
        ...item,
        id: existingIds.has(item.id)
          ? `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
          : item.id,
      }));

      const merged = [...newItems, ...expenses];
      saveExpenses(merged);
    },
    [expenses, saveExpenses]
  );

  const updateFilterField = useCallback(
    <K extends keyof ExpenseFilters>(field: K, value: ExpenseFilters[K]) => {
      setFilters((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Compute Filtered Expenses
  const filteredExpenses = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return expenses.filter((expense) => {
      // Search filter
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

      // Category filter
      if (filters.category !== 'all' && expense.category !== filters.category) {
        return false;
      }

      // Min/Max amount filter
      if (filters.minAmount !== undefined && expense.amount < filters.minAmount) {
        return false;
      }
      if (filters.maxAmount !== undefined && expense.amount > filters.maxAmount) {
        return false;
      }

      // Date preset & range filter
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
  }, [expenses, filters]);

  // Compute Overall and Monthly Analytics Summary
  const summary = useMemo<SpendingSummary>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
  }, [expenses]);

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        filteredExpenses,
        filters,
        currency,
        budget,
        summary,
        isLoading,
        addExpense,
        updateExpense,
        deleteExpense,
        setFilters,
        updateFilterField,
        resetFilters,
        setCurrency,
        updateBudget,
        resetToSample,
        clearAllData,
        importExpenses,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export function useExpenses(): ExpenseContextType {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
}

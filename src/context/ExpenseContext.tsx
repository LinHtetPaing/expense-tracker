'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  BudgetSettings,
  CurrencyCode,
  Expense,
  ExpenseFilters,
  ExpenseFormData,
  SpendingSummary,
} from '@/types/expense';
import { DEFAULT_BUDGET, DEFAULT_FILTERS } from '@/utils/constants';
import { filterExpenses, mergeImportedExpenses, summarizeExpenses } from '@/utils/expenseStats';
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
      saveExpenses(mergeImportedExpenses(expenses, imported));
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

  const filteredExpenses = useMemo(
    () => filterExpenses(expenses, filters),
    [expenses, filters]
  );

  const summary = useMemo<SpendingSummary>(
    () => summarizeExpenses(expenses),
    [expenses]
  );

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

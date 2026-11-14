import { Expense, ExpenseFormData } from '@/types/expense';

export function createExpense(data: ExpenseFormData, id: string, nowIso: string): Expense {
  return {
    ...data,
    id,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

export function prependExpense(expenses: Expense[], expense: Expense): Expense[] {
  return [expense, ...expenses];
}

export function updateExpenseInList(
  expenses: Expense[],
  id: string,
  data: ExpenseFormData,
  nowIso: string
): { updated: boolean; expenses: Expense[] } {
  const index = expenses.findIndex((expense) => expense.id === id);
  if (index === -1) {
    return { updated: false, expenses };
  }

  const updatedList = [...expenses];
  updatedList[index] = {
    ...updatedList[index],
    ...data,
    updatedAt: nowIso,
  };

  return { updated: true, expenses: updatedList };
}

export function deleteExpenseFromList(
  expenses: Expense[],
  id: string
): { deleted: boolean; expenses: Expense[] } {
  const filtered = expenses.filter((expense) => expense.id !== id);
  if (filtered.length === expenses.length) {
    return { deleted: false, expenses };
  }

  return { deleted: true, expenses: filtered };
}

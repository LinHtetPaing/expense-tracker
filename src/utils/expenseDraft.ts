import {
  Category,
  CATEGORIES,
  ExpenseFormData,
  PaymentMethod,
} from '@/types/expense';

export interface ExpenseDraftInput {
  description: string;
  amount: string;
  category: Category;
  date: string;
  paymentMethod: PaymentMethod;
  notes: string;
}

export interface ExpenseDraftErrors {
  description?: string;
  amount?: string;
  category?: string;
  date?: string;
}

export function validateExpenseDraft(input: ExpenseDraftInput): ExpenseDraftErrors {
  const errors: ExpenseDraftErrors = {};

  if (!input.description.trim()) {
    errors.description = 'Description is required';
  } else if (input.description.trim().length > 100) {
    errors.description = 'Description cannot exceed 100 characters';
  }

  const parsedAmount = parseFloat(input.amount);
  if (!input.amount || isNaN(parsedAmount)) {
    errors.amount = 'Please enter a valid amount';
  } else if (parsedAmount <= 0) {
    errors.amount = 'Amount must be greater than 0';
  } else if (parsedAmount > 1000000) {
    errors.amount = 'Amount cannot exceed $1,000,000';
  }

  if (!input.category || !CATEGORIES.includes(input.category)) {
    errors.category = 'Please select a valid category';
  }

  if (!input.date) {
    errors.date = 'Date is required';
  } else if (isNaN(Date.parse(input.date))) {
    errors.date = 'Please enter a valid date';
  }

  return errors;
}

export function toExpenseFormData(input: ExpenseDraftInput): ExpenseFormData {
  return {
    description: input.description.trim(),
    amount: Math.round(parseFloat(input.amount) * 100) / 100,
    category: input.category,
    date: input.date,
    paymentMethod: input.paymentMethod,
    notes: input.notes.trim() ? input.notes.trim() : undefined,
  };
}

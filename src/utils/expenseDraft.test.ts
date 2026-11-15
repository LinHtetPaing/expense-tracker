import { describe, expect, it } from 'vitest';
import { Category, PaymentMethod } from '@/types/expense';
import { ExpenseDraftInput, toExpenseFormData, validateExpenseDraft } from '@/utils/expenseDraft';

function draft(overrides: Partial<ExpenseDraftInput> = {}): ExpenseDraftInput {
  return {
    description: 'Weekly groceries',
    amount: '19.99',
    category: 'Food',
    date: '2026-11-13',
    paymentMethod: 'Debit Card',
    notes: '  market  ',
    ...overrides,
  };
}

describe('validateExpenseDraft', () => {
  it('accepts a complete draft, including the one million limit', () => {
    expect(validateExpenseDraft(draft())).toEqual({});
    expect(validateExpenseDraft(draft({ amount: '1000000', description: `  ${'a'.repeat(100)}  ` }))).toEqual({});
  });

  it('reports every missing or out-of-range field together', () => {
    expect(
      validateExpenseDraft(
        draft({
          description: '   ',
          amount: '',
          category: '' as Category,
          date: '',
        })
      )
    ).toEqual({
      description: 'Description is required',
      amount: 'Please enter a valid amount',
      category: 'Please select a valid category',
      date: 'Date is required',
    });
  });

  it('rejects amounts that are not positive or are above one million', () => {
    expect(validateExpenseDraft(draft({ amount: 'abc' })).amount).toBe('Please enter a valid amount');
    expect(validateExpenseDraft(draft({ amount: '0' })).amount).toBe('Amount must be greater than 0');
    expect(validateExpenseDraft(draft({ amount: '-5' })).amount).toBe('Amount must be greater than 0');
    expect(validateExpenseDraft(draft({ amount: '1000000.01' })).amount).toBe(
      'Amount cannot exceed $1,000,000'
    );
  });

  it('rejects a description over 100 characters, an unknown category, and an unparseable date', () => {
    expect(validateExpenseDraft(draft({ description: 'a'.repeat(101) })).description).toBe(
      'Description cannot exceed 100 characters'
    );
    expect(validateExpenseDraft(draft({ category: 'Rent' as Category })).category).toBe(
      'Please select a valid category'
    );
    expect(validateExpenseDraft(draft({ date: 'not-a-date' })).date).toBe('Please enter a valid date');
  });
});

describe('toExpenseFormData', () => {
  it('trims text, drops blank notes, and rounds the amount to cents', () => {
    expect(toExpenseFormData(draft({ amount: '10.555', notes: '   ' }))).toEqual({
      description: 'Weekly groceries',
      amount: 10.56,
      category: 'Food',
      date: '2026-11-13',
      paymentMethod: 'Debit Card' satisfies PaymentMethod,
      notes: undefined,
    });

    expect(toExpenseFormData(draft({ amount: '10.126' })).amount).toBe(10.13);
    expect(toExpenseFormData(draft({ amount: '10.005' })).amount).toBe(10.01);
    expect(toExpenseFormData(draft({ amount: '10.995' })).amount).toBe(11);
    expect(toExpenseFormData(draft()).notes).toBe('market');
  });
});

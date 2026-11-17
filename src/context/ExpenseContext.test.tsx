// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExpenseProvider, useExpenses } from '@/context/ExpenseContext';
import { Expense, ExpenseFormData } from '@/types/expense';
import { DEFAULT_BUDGET, DEFAULT_FILTERS } from '@/utils/constants';
import { filterExpenses, summarizeExpenses } from '@/utils/expenseStats';
import { getSampleExpenses } from '@/utils/sampleData';
import {
  getStoredBudget,
  getStoredCurrency,
  getStoredExpenses,
  saveStoredBudget,
  saveStoredCurrency,
  saveStoredExpenses,
} from '@/utils/storage';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type ExpenseApi = ReturnType<typeof useExpenses>;

const roots: Root[] = [];

function record(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'rent',
    description: 'Rent',
    amount: 40,
    category: 'Bills',
    date: '2026-11-01',
    paymentMethod: 'Bank Transfer',
    notes: 'apartment',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
    ...overrides,
  };
}

function form(overrides: Partial<ExpenseFormData> = {}): ExpenseFormData {
  return {
    description: 'Train pass',
    amount: 12.5,
    category: 'Transportation',
    date: '2026-11-10',
    paymentMethod: 'Cash',
    ...overrides,
  };
}

function mountProvider(): { api: () => ExpenseApi; unmount: () => void } {
  let current: ExpenseApi | null = null;
  let active = true;

  function Probe() {
    current = useExpenses();
    return null;
  }

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);

  act(() => {
    root.render(
      <ExpenseProvider>
        <Probe />
      </ExpenseProvider>
    );
  });

  if (!current) {
    throw new Error('Expense provider did not render');
  }

  return {
    api: () => {
      if (!current) throw new Error('Expense provider is not mounted');
      return current;
    },
    unmount: () => {
      if (!active) return;
      active = false;
      act(() => root.unmount());
      container.remove();
      current = null;
      const index = roots.indexOf(root);
      if (index >= 0) roots.splice(index, 1);
    },
  };
}

function seedLedger() {
  saveStoredExpenses([
    record(),
    record({
      id: 'coffee',
      description: 'Coffee',
      amount: 4,
      category: 'Food',
      date: '2026-11-16',
      notes: 'latte',
    }),
  ]);
  saveStoredCurrency('JPY');
  saveStoredBudget({
    ...DEFAULT_BUDGET,
    overallMonthly: 900,
    categoryBudgets: { ...DEFAULT_BUDGET.categoryBudgets, Food: 111 },
  });
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-16T12:00:00.000Z'));
  vi.spyOn(Math, 'random').mockReturnValue(0.123456789);
});

afterEach(() => {
  while (roots.length > 0) {
    const root = roots.pop();
    act(() => root?.unmount());
  }
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
  localStorage.clear();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('ExpenseProvider', () => {
  it('rejects a screen that reads the ledger without the provider', () => {
    let caught: Error | null = null;

    class Boundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
      state = { failed: false };

      static getDerivedStateFromError(error: Error) {
        caught = error;
        return { failed: true };
      }

      render() {
        return this.state.failed ? null : this.props.children;
      }
    }

    function Outside() {
      useExpenses();
      return null;
    }

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    roots.push(root);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    act(() => {
      root.render(
        <Boundary>
          <Outside />
        </Boundary>
      );
    });

    expect(caught).toEqual(new Error('useExpenses must be used within an ExpenseProvider'));
    consoleError.mockRestore();
  });

  it('seeds the sample ledger on a first visit and then leaves the loading state', () => {
    const view = mountProvider();

    expect(view.api().isLoading).toBe(false);
    expect(view.api().expenses).toEqual(getSampleExpenses());
    expect(getStoredExpenses()).toEqual(getSampleExpenses());
    expect(view.api().currency).toBe('USD');
    expect(view.api().budget).toEqual(DEFAULT_BUDGET);
    expect(view.api().filters).toEqual(DEFAULT_FILTERS);
    expect(view.api().filteredExpenses).toEqual(filterExpenses(view.api().expenses, DEFAULT_FILTERS, new Date()));
    expect(view.api().summary).toEqual(summarizeExpenses(view.api().expenses, new Date()));
  });

  it('restores the saved ledger, currency, and budget', () => {
    seedLedger();
    const view = mountProvider();

    expect(view.api().isLoading).toBe(false);
    expect(view.api().expenses.map((item) => item.id)).toEqual(['rent', 'coffee']);
    expect(view.api().currency).toBe('JPY');
    expect(view.api().budget.overallMonthly).toBe(900);
    expect(view.api().budget.categoryBudgets.Food).toBe(111);
    expect(view.api().summary.totalSpent).toBe(44);
  });

  it('saves an added, edited, or deleted record and ignores an unknown id', () => {
    seedLedger();
    const view = mountProvider();
    const stamp = new Date().toISOString();
    const id = `exp-${Date.now()}-${(0.123456789).toString(36).substring(2, 6)}`;
    let added: Expense | undefined;

    act(() => {
      added = view.api().addExpense(form());
    });

    expect(added).toEqual({
      ...form(),
      id,
      createdAt: stamp,
      updatedAt: stamp,
    });
    expect(view.api().expenses.map((item) => item.id)).toEqual([id, 'rent', 'coffee']);
    expect(getStoredExpenses()).toEqual(view.api().expenses);

    let edited = false;
    act(() => {
      edited = view.api().updateExpense('rent', form({ description: 'Updated rent', amount: 41 }));
    });

    expect(edited).toBe(true);
    const rent = view.api().expenses.find((item) => item.id === 'rent');
    expect(rent).toMatchObject({
      description: 'Updated rent',
      amount: 41,
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: stamp,
    });
    expect(getStoredExpenses()).toEqual(view.api().expenses);

    const beforeMissingEdit = getStoredExpenses();
    let missingEdit = true;
    act(() => {
      missingEdit = view.api().updateExpense('missing', form({ description: 'Nope' }));
    });
    expect(missingEdit).toBe(false);
    expect(getStoredExpenses()).toEqual(beforeMissingEdit);

    let removed = false;
    act(() => {
      removed = view.api().deleteExpense('coffee');
    });
    expect(removed).toBe(true);
    expect(view.api().expenses.map((item) => item.id)).toEqual([id, 'rent']);
    expect(getStoredExpenses().map((item) => item.id)).toEqual([id, 'rent']);

    let missingDelete = true;
    act(() => {
      missingDelete = view.api().deleteExpense('coffee');
    });
    expect(missingDelete).toBe(false);
    expect(getStoredExpenses().map((item) => item.id)).toEqual([id, 'rent']);
  });

  it('keeps a filtered-out record in the saved ledger and in the spending total', () => {
    seedLedger();
    const view = mountProvider();

    act(() => {
      view.api().updateFilterField('category', 'Food');
    });
    expect(view.api().filteredExpenses.map((item) => item.id)).toEqual(['coffee']);
    expect(view.api().summary.totalSpent).toBe(44);
    expect(view.api().summary.totalCount).toBe(2);

    act(() => {
      view.api().addExpense(form());
    });

    const addedId = view.api().expenses[0].id;
    expect(view.api().expenses[0].category).toBe('Transportation');
    expect(view.api().filteredExpenses.map((item) => item.id)).toEqual(['coffee']);
    expect(getStoredExpenses()[0].description).toBe('Train pass');
    expect(view.api().summary.totalSpent).toBe(56.5);

    act(() => {
      view.api().setFilters({ ...DEFAULT_FILTERS, search: '  APARTMENT ' });
    });
    expect(view.api().filteredExpenses.map((item) => item.id)).toEqual(['rent']);

    act(() => {
      view.api().resetFilters();
    });
    expect(view.api().filters).toEqual(DEFAULT_FILTERS);
    expect(view.api().filteredExpenses.map((item) => item.id)).toEqual(['coffee', addedId, 'rent']);
    expect(getStoredExpenses()).toHaveLength(3);
  });

  it('stores an imported record ahead of the ledger and keeps the record whose id collided', () => {
    seedLedger();
    const view = mountProvider();
    const generatedId = `exp-${Date.now()}-${(0.123456789).toString(36).substring(2, 6)}`;

    act(() => {
      view.api().importExpenses([
        record({
          id: 'fresh',
          description: 'Imported snack',
          amount: 3,
          category: 'Food',
          date: '2026-11-15',
        }),
        record({ id: 'rent', description: 'Clash', amount: 1 }),
      ]);
    });

    expect(view.api().expenses.map((item) => item.id)).toEqual(['fresh', generatedId, 'rent', 'coffee']);
    expect(view.api().expenses.map((item) => item.description)).toEqual([
      'Imported snack',
      'Clash',
      'Rent',
      'Coffee',
    ]);
    expect(getStoredExpenses()).toEqual(view.api().expenses);
  });

  it('remembers a new currency and budget, and a cleared ledger does not bring the samples back', () => {
    seedLedger();
    const view = mountProvider();
    const nextBudget = {
      ...view.api().budget,
      overallMonthly: 1500,
      categoryBudgets: { ...view.api().budget.categoryBudgets, Bills: 700 },
    };

    act(() => {
      view.api().setCurrency('CAD');
      view.api().updateBudget(nextBudget);
    });

    view.unmount();
    const restored = mountProvider();
    expect(restored.api().currency).toBe('CAD');
    expect(restored.api().budget).toEqual(nextBudget);
    expect(getStoredCurrency()).toBe('CAD');
    expect(getStoredBudget()).toEqual(nextBudget);

    act(() => {
      restored.api().clearAllData();
    });
    expect(restored.api().expenses).toEqual([]);
    expect(getStoredExpenses()).toEqual([]);
    expect(restored.api().currency).toBe('CAD');
    expect(getStoredBudget()).toEqual(nextBudget);
    expect(restored.api().summary.totalSpent).toBe(0);

    act(() => {
      restored.api().resetToSample();
    });
    expect(restored.api().expenses).toEqual(getSampleExpenses());
    expect(getStoredExpenses()).toEqual(getSampleExpenses());
    expect(getStoredCurrency()).toBe('CAD');
    expect(getStoredBudget()).toEqual(nextBudget);
  });

  it('finishes loading with an empty ledger when saved values cannot be read', () => {
    const blockedStorage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {},
      clear: () => {},
    };
    vi.stubGlobal('localStorage', blockedStorage);
    const view = mountProvider();

    expect(view.api().isLoading).toBe(false);
    expect(view.api().expenses).toEqual([]);
    expect(view.api().currency).toBe('USD');
    expect(view.api().budget).toEqual(DEFAULT_BUDGET);
    expect(view.api().summary.totalCount).toBe(0);
  });
});

import { describe, expect, it } from 'vitest';
import {
  budgetProgressColor,
  categoryBudgetProgress,
  overallBudgetProgress,
} from '@/utils/budgetProgress';

describe('overallBudgetProgress', () => {
  it('uses 2500 when the saved monthly target is missing', () => {
    expect(overallBudgetProgress(0, 0)).toEqual({
      target: 2500,
      percentage: 0,
      remaining: 2500,
      isOverBudget: false,
    });
  });

  it('marks the budget over the limit even when the rounded percentage is still 100', () => {
    expect(overallBudgetProgress(2501, 2500)).toEqual({
      target: 2500,
      percentage: 100,
      remaining: -1,
      isOverBudget: true,
    });
  });

  it('reports the percent used and the amount left', () => {
    expect(overallBudgetProgress(1100, 1000)).toMatchObject({
      percentage: 110,
      remaining: -100,
      isOverBudget: true,
    });
  });
});

describe('categoryBudgetProgress', () => {
  it('uses the category fallback when the saved target is zero', () => {
    expect(categoryBudgetProgress(100, 0, 200)).toEqual({ target: 200, percentage: 50 });
  });

  it('does not divide by zero when both targets are missing', () => {
    expect(categoryBudgetProgress(25, 0, 0)).toEqual({ target: 0, percentage: 0 });
  });
});

describe('budgetProgressColor', () => {
  it('stays green through 85 percent, turns amber above that, and turns red above 100', () => {
    expect(budgetProgressColor(85)).toBe('bg-emerald-500');
    expect(budgetProgressColor(86)).toBe('bg-amber-500');
    expect(budgetProgressColor(100)).toBe('bg-amber-500');
    expect(budgetProgressColor(101)).toBe('bg-rose-500');
  });
});

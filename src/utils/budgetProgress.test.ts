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

  it('treats an exact match as the full budget with nothing left and not over the limit', () => {
    expect(overallBudgetProgress(2500, 2500)).toEqual({
      target: 2500,
      percentage: 100,
      remaining: 0,
      isOverBudget: false,
    });
  });

  it('rounds half a percent up and drops a smaller fraction', () => {
    expect(overallBudgetProgress(5, 1000).percentage).toBe(1);
    expect(overallBudgetProgress(4, 1000).percentage).toBe(0);
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

  it('reports more than 100 percent when the category is over its target', () => {
    expect(categoryBudgetProgress(250, 200, 100)).toEqual({ target: 200, percentage: 125 });
  });

  it('rounds a partial percent to the nearest whole number', () => {
    expect(categoryBudgetProgress(1, 3, 9)).toEqual({ target: 3, percentage: 33 });
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

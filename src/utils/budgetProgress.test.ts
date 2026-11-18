import { describe, expect, it } from 'vitest';
import {
  budgetProgressColor,
  categoryBudgetProgress,
  overallBudgetProgress,
  parseBudgetInput,
} from '@/utils/budgetProgress';

describe('parseBudgetInput', () => {
  it('turns a blank field, a lone sign, or other text that is not a number into zero', () => {
    expect(parseBudgetInput('')).toBe(0);
    expect(parseBudgetInput('0')).toBe(0);
    expect(parseBudgetInput('-')).toBe(0);
    expect(parseBudgetInput('.')).toBe(0);
    expect(parseBudgetInput('abc')).toBe(0);
  });

  it('keeps a fraction, a leading number, and a negative target', () => {
    expect(parseBudgetInput('10.50')).toBe(10.5);
    expect(parseBudgetInput('12abc')).toBe(12);
    expect(parseBudgetInput('1e2')).toBe(100);
    expect(parseBudgetInput('-50')).toBe(-50);
  });

  it('turns a cleared monthly field into the fallback target, and keeps a negative target', () => {
    expect(overallBudgetProgress(100, parseBudgetInput(''))).toEqual({
      target: 2500,
      percentage: 4,
      remaining: 2400,
      isOverBudget: false,
    });
    expect(overallBudgetProgress(100, parseBudgetInput('-50'))).toEqual({
      target: -50,
      percentage: -200,
      remaining: -150,
      isOverBudget: true,
    });
    expect(categoryBudgetProgress(40, parseBudgetInput(''), 200)).toEqual({
      target: 200,
      percentage: 20,
    });
    expect(categoryBudgetProgress(40, parseBudgetInput('-10'), 200)).toEqual({
      target: -10,
      percentage: 0,
    });
  });
});

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

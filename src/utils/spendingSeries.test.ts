import { describe, expect, it } from 'vitest';
import { Category, Expense } from '@/types/expense';
import { CATEGORY_CONFIG } from '@/utils/constants';
import {
  buildCategoryChartPoints,
  buildDailySpendingTrend,
  buildMonthlySpending,
} from '@/utils/spendingSeries';

const NOW = new Date(2026, 10, 13, 9, 0, 0);

function expense(date: string, amount: number): Expense {
  return {
    id: `${date}-${amount}`,
    description: 'Expense',
    amount,
    category: 'Food',
    date,
    createdAt: '2026-11-13T00:00:00.000Z',
    updatedAt: '2026-11-13T00:00:00.000Z',
  };
}

describe('buildDailySpendingTrend', () => {
  it('sums the last 14 calendar days and rounds the daily total to cents', () => {
    const series = buildDailySpendingTrend(
      [
        expense('2026-11-13', 10.25),
        expense('2026-11-13', 1.25),
        expense('2026-10-31', 4),
        expense('2026-10-30', 99),
      ],
      NOW
    );

    expect(series).toHaveLength(14);
    expect(series[0].dateStr).toBe('2026-10-31');
    expect(series[0].amount).toBe(4);
    expect(series[0].count).toBe(1);
    expect(series[13]).toMatchObject({ dateStr: '2026-11-13', label: 'Nov 13', amount: 11.5, count: 2 });
    expect(series.some((point) => point.dateStr === '2026-10-30')).toBe(false);
  });

  it('rounds a daily total that cannot be stored exactly in binary', () => {
    const series = buildDailySpendingTrend(
      [expense('2026-11-13', 0.1), expense('2026-11-13', 0.2)],
      NOW
    );

    expect(series[13].amount).toBe(0.3);
    expect(series[13].count).toBe(2);
  });

  it('does not plot an impossible day on the real day it rolls into', () => {
    const now = new Date(2026, 2, 3, 12, 0, 0);
    const series = buildDailySpendingTrend(
      [expense('2026-02-31', 18), expense('2026-03-03', 2), expense('November 1', 7)],
      now
    );

    expect(series[13]).toMatchObject({ dateStr: '2026-03-03', label: 'Mar 3', amount: 2, count: 1 });
    expect(series.some((point) => point.dateStr === '2026-02-31')).toBe(false);
    expect(series.reduce((sum, point) => sum + point.amount, 0)).toBe(2);
  });

  it('plots a real leap day on February 29', () => {
    const now = new Date(2024, 1, 29, 12, 0, 0);
    const series = buildDailySpendingTrend([expense('2024-02-29', 6)], now);

    expect(series).toHaveLength(14);
    expect(series[13]).toMatchObject({ dateStr: '2024-02-29', label: 'Feb 29', amount: 6, count: 1 });
  });

  it('includes the December days that belong to a window starting in January', () => {
    const now = new Date(2026, 0, 2, 9, 0, 0);
    const series = buildDailySpendingTrend(
      [
        expense('2025-12-19', 9),
        expense('2025-12-20', 3),
        expense('2026-01-02', 1.1),
        expense('2026-01-02', 1.2),
      ],
      now
    );

    expect(series).toHaveLength(14);
    expect(series[0]).toMatchObject({ dateStr: '2025-12-20', label: 'Dec 20', amount: 3, count: 1 });
    expect(series.some((point) => point.dateStr === '2025-12-19')).toBe(false);
    expect(series[13]).toMatchObject({ dateStr: '2026-01-02', label: 'Jan 2', amount: 2.3, count: 2 });
  });
});

describe('buildMonthlySpending', () => {
  it('sums the last six months by calendar month, including the oldest month boundary', () => {
    const series = buildMonthlySpending(
      [
        expense('2026-11-02', 3),
        expense('2026-11-20', 1.5),
        expense('2026-06-01', 2),
        expense('2026-05-31', 50),
      ],
      NOW
    );

    expect(series.map((point) => point.monthStr)).toEqual([
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
      '2026-11',
    ]);
    expect(series[0]).toMatchObject({ label: 'Jun 2026', amount: 2, count: 1 });
    expect(series[5]).toMatchObject({ label: 'Nov 2026', amount: 4.5, count: 2 });
  });

  it('rounds a monthly total that cannot be stored exactly in binary', () => {
    const series = buildMonthlySpending(
      [expense('2026-11-01', 0.1), expense('2026-11-02', 0.2)],
      NOW
    );

    expect(series[5].amount).toBe(0.3);
    expect(series[5].count).toBe(2);
  });

  it('counts an impossible day in the month written on the date, not the month it rolls into', () => {
    const now = new Date(2026, 2, 3, 12, 0, 0);
    const series = buildMonthlySpending(
      [expense('2026-02-31', 18), expense('2026-03-03', 2), expense('November 1', 7)],
      now
    );

    expect(series.find((point) => point.monthStr === '2026-02')).toMatchObject({
      label: 'Feb 2026',
      amount: 18,
      count: 1,
    });
    expect(series.find((point) => point.monthStr === '2026-03')).toMatchObject({
      label: 'Mar 2026',
      amount: 2,
      count: 1,
    });
    expect(series.reduce((sum, point) => sum + point.amount, 0)).toBe(20);
  });

  it('counts a real leap day in February', () => {
    const now = new Date(2024, 1, 29, 12, 0, 0);
    const series = buildMonthlySpending([expense('2024-02-29', 6), expense('2024-03-01', 1)], now);

    expect(series[5]).toMatchObject({ monthStr: '2024-02', label: 'Feb 2024', amount: 6, count: 1 });
    expect(series.find((point) => point.monthStr === '2024-03')).toBeUndefined();
  });

  it('keeps the previous year when the six-month window starts in October', () => {
    const now = new Date(2026, 2, 31, 9, 0, 0);
    const series = buildMonthlySpending(
      [
        expense('2025-09-30', 8),
        expense('2025-10-01', 4),
        expense('2025-10-31', 1),
        expense('2026-02-28', 2),
        expense('2026-03-01', 0.2),
        expense('2026-03-31', 0.1),
      ],
      now
    );

    expect(series.map((point) => point.monthStr)).toEqual([
      '2025-10',
      '2025-11',
      '2025-12',
      '2026-01',
      '2026-02',
      '2026-03',
    ]);
    expect(series[0]).toMatchObject({ label: 'Oct 2025', amount: 5, count: 2 });
    expect(series[4]).toMatchObject({ amount: 2, count: 1 });
    expect(series[5]).toMatchObject({ label: 'Mar 2026', amount: 0.3, count: 2 });
  });
});

describe('buildCategoryChartPoints', () => {
  it('keeps only categories with spending, in the same order, with their chart color', () => {
    const points = buildCategoryChartPoints([
      { category: 'Food', amount: 0, count: 0, percentage: 0 },
      { category: 'Bills', amount: 10, count: 1, percentage: 40 },
      { category: 'Shopping', amount: -3, count: 1, percentage: 0 },
      { category: 'Other', amount: 15, count: 2, percentage: 60 },
    ]);

    expect(points).toEqual([
      {
        name: 'Bills',
        value: 10,
        percentage: 40,
        count: 1,
        color: CATEGORY_CONFIG.Bills.hexColor,
      },
      {
        name: 'Other',
        value: 15,
        percentage: 60,
        count: 2,
        color: CATEGORY_CONFIG.Other.hexColor,
      },
    ]);
  });

  it('uses the neutral color when a category has no configured color', () => {
    const [point] = buildCategoryChartPoints([
      { category: 'Rent' as Category, amount: 5, count: 1, percentage: 100 },
    ]);

    expect(point.color).toBe('#64748b');
    expect(point.name).toBe('Rent');
  });
});

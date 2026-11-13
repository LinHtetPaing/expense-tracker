import { describe, expect, it } from 'vitest';
import { Expense } from '@/types/expense';
import { buildDailySpendingTrend, buildMonthlySpending } from '@/utils/spendingSeries';

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
});

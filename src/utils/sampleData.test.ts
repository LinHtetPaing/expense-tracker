import { afterEach, describe, expect, it, vi } from 'vitest';
import { format, subDays, subMonths } from 'date-fns';
import { CATEGORIES, PAYMENT_METHODS } from '@/types/expense';
import { getSampleExpenses } from '@/utils/sampleData';

afterEach(() => {
  vi.useRealTimers();
});

function expectSeedLedger(now: Date) {
  vi.useFakeTimers();
  vi.setSystemTime(now);

  const samples = getSampleExpenses();
  const ids = samples.map((item) => item.id);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  expect(samples.length).toBeGreaterThan(0);
  expect(new Set(ids).size).toBe(ids.length);

  for (const item of samples) {
    expect(CATEGORIES).toContain(item.category);
    expect(PAYMENT_METHODS).toContain(item.paymentMethod);
    expect(item.amount).toBeGreaterThan(0);
    expect(Number.isFinite(item.amount)).toBe(true);
    expect(item.amount).toBe(Math.round(item.amount * 100) / 100);
    expect(item.description).toBe(item.description.trim());
    expect(item.description.length).toBeGreaterThan(0);
    expect(item.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const [year, month, day] = item.date.split('-').map(Number);
    const parsed = new Date(year, month - 1, day);
    expect(parsed.getFullYear()).toBe(year);
    expect(parsed.getMonth()).toBe(month - 1);
    expect(parsed.getDate()).toBe(day);
    expect(parsed.getTime()).toBeLessThanOrEqual(today.getTime());
    expect(Number.isNaN(Date.parse(item.createdAt))).toBe(false);
    expect(item.updatedAt).toBe(item.createdAt);
  }

  expect(samples.some((item) => item.date === format(now, 'yyyy-MM-dd'))).toBe(true);
  expect(samples.some((item) => item.date === format(subDays(now, 1), 'yyyy-MM-dd'))).toBe(true);
  expect(samples.some((item) => item.date.startsWith(format(subMonths(now, 1), 'yyyy-MM')))).toBe(true);
}

describe('getSampleExpenses', () => {
  it('seeds a valid ledger for today, yesterday, and last month', () => {
    expectSeedLedger(new Date(2026, 10, 15, 12, 0, 0));
  });

  it('keeps real calendar dates when the month does not have the same last day', () => {
    expectSeedLedger(new Date(2026, 2, 31, 12, 0, 0));
    expectSeedLedger(new Date(2026, 0, 31, 12, 0, 0));
  });
});

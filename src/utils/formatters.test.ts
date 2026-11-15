import { afterEach, describe, expect, it, vi } from 'vitest';
import { format, subDays } from 'date-fns';
import {
  formatCurrency,
  formatDate,
  formatPercentage,
  formatRelativeDate,
  truncateText,
} from '@/utils/formatters';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('formatCurrency', () => {
  it('formats United States dollars with cents', () => {
    expect(formatCurrency(12.5)).toBe('$12.50');
    expect(formatCurrency(-5.5, 'USD')).toBe('-$5.50');
    expect(formatCurrency(1234.5)).toBe('$1,234.50');
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('formats pounds with a grouped amount', () => {
    expect(formatCurrency(1234.5, 'GBP')).toBe('£1,234.50');
  });

  it('falls back to the currency symbol when number formatting is unavailable', () => {
    vi.spyOn(Intl, 'NumberFormat').mockImplementation(() => {
      throw new Error('unavailable');
    });

    expect(formatCurrency(12.5, 'EUR')).toBe('€12.50');
  });
});

describe('formatDate', () => {
  it('formats a calendar date without shifting the day', () => {
    expect(formatDate('2026-11-13')).toBe('Nov 13, 2026');
    expect(formatDate('2026-11-15', 'yyyy-MM-dd')).toBe('2026-11-15');
    expect(formatDate('')).toBe('');
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
});

describe('formatRelativeDate', () => {
  it('labels today and yesterday, and formats older calendar dates', () => {
    const today = new Date();
    const yesterday = subDays(today, 1);

    expect(formatRelativeDate(format(today, 'yyyy-MM-dd'))).toBe('Today');
    expect(formatRelativeDate(format(yesterday, 'yyyy-MM-dd'))).toBe('Yesterday');
    expect(formatRelativeDate('2020-01-02')).toBe('Jan 2, 2020');
    expect(formatRelativeDate('bad')).toBe('bad');
  });
});

describe('formatPercentage and truncateText', () => {
  it('shows the sign and one decimal place', () => {
    expect(formatPercentage(12.34)).toBe('+12.3%');
    expect(formatPercentage(-2)).toBe('-2.0%');
    expect(formatPercentage(0)).toBe('+0.0%');
  });

  it('leaves short text unchanged and cuts long text', () => {
    expect(truncateText('')).toBe('');
    expect(truncateText('rent', 4)).toBe('rent');
    expect(truncateText('groceries', 3)).toBe('gro...');
  });
});

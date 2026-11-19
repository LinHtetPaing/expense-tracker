'use client';

import React from 'react';
import { useExpenses } from '@/context/ExpenseContext';
import { formatCurrency } from '@/utils/formatters';
import { monthComparisonBadge } from '@/utils/expenseStats';
import { CATEGORY_CONFIG } from '@/utils/constants';
import { CategoryIcon } from '../ui/CategoryIcon';
import {
  Wallet,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Activity,
  Award,
  Layers,
} from 'lucide-react';

export const SummaryCards: React.FC = () => {
  const { summary, currency } = useExpenses();

  const comparison = monthComparisonBadge(summary.lastMonthSpent, summary.monthlyChangePercent);
  const topCatConfig = summary.topCategory
    ? CATEGORY_CONFIG[summary.topCategory.category]
    : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* 1. Total Spending */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Spent
          </span>
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(summary.totalSpent, currency)}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>Across {summary.totalCount} recorded expenses</span>
          </p>
        </div>
      </div>

      {/* 2. This Month's Spending */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            This Month
          </span>
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <CalendarDays className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(summary.thisMonthSpent, currency)}
          </h3>
          <div className="mt-1 flex items-center gap-1.5 text-xs">
            {comparison.kind === 'change' ? (
              <span
                className={`inline-flex items-center font-semibold gap-0.5 px-1.5 py-0.5 rounded-md ${
                  comparison.direction === 'higher'
                    ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-400'
                    : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400'
                }`}
              >
                {comparison.direction === 'higher' ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {comparison.label}
              </span>
            ) : (
              <span className="text-slate-400">First active month</span>
            )}
            <span className="text-slate-400">vs last month</span>
          </div>
        </div>
      </div>

      {/* 3. This Week's Spending & Daily Average */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            This Week
          </span>
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(summary.thisWeekSpent, currency)}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span>Avg / transaction: </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {formatCurrency(summary.averageExpense, currency)}
            </span>
          </p>
        </div>
      </div>

      {/* 4. Top Spending Category */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Top Category
          </span>
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          {summary.topCategory && topCatConfig ? (
            <>
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                  style={{ backgroundColor: `${topCatConfig.hexColor}20`, color: topCatConfig.hexColor }}
                >
                  <CategoryIcon category={summary.topCategory.category} className="w-4 h-4" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
                  {topCatConfig.name}
                </h3>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {formatCurrency(summary.topCategory.amount, currency)}
                </span>{' '}
                ({summary.topCategory.count} expenses)
              </p>
            </>
          ) : (
            <>
              <h3 className="text-xl font-semibold text-slate-400">No Data</h3>
              <p className="mt-1 text-xs text-slate-400">Record expenses to see top category</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

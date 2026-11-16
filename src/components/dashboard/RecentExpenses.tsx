'use client';

import React from 'react';
import { useExpenses } from '@/context/ExpenseContext';
import { formatCurrency, formatRelativeDate } from '@/utils/formatters';
import { CategoryIcon } from '../ui/CategoryIcon';
import { CATEGORY_CONFIG } from '@/utils/constants';
import { selectRecentExpenses } from '@/utils/expenseGroups';
import { ArrowRight, History, Plus } from 'lucide-react';

interface RecentExpensesProps {
  onViewAllClick: () => void;
  onAddExpenseClick: () => void;
}

export const RecentExpenses: React.FC<RecentExpensesProps> = ({
  onViewAllClick,
  onAddExpenseClick,
}) => {
  const { expenses, currency } = useExpenses();

  const recent = React.useMemo(() => selectRecentExpenses(expenses), [expenses]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Transactions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Latest recorded expenses
            </p>
          </div>
        </div>

        {expenses.length > 0 && (
          <button
            type="button"
            onClick={onViewAllClick}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            <span>View all ({expenses.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* List */}
      {recent.length === 0 ? (
        <div className="py-8 text-center space-y-2 text-slate-400">
          <p className="text-sm font-medium">No transactions recorded yet</p>
          <button
            onClick={onAddExpenseClick}
            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            Add your first expense
          </button>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {recent.map((item) => {
            const config = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.Other;

            return (
              <div
                key={item.id}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 rounded-xl px-2 -mx-2 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: `${config.hexColor}15`,
                      color: config.hexColor,
                    }}
                  >
                    <CategoryIcon category={item.category} className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {item.description}
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span>{formatRelativeDate(item.date)}</span>
                      <span>•</span>
                      <span>{item.category}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {formatCurrency(item.amount, currency)}
                  </p>
                  {item.paymentMethod && (
                    <p className="text-[11px] text-slate-400">{item.paymentMethod}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

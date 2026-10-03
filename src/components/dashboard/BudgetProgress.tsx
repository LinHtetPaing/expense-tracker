'use client';

import React, { useState } from 'react';
import { useExpenses } from '@/context/ExpenseContext';
import { useToast } from '@/context/ToastContext';
import { formatCurrency } from '@/utils/formatters';
import { CATEGORIES, Category, BudgetSettings } from '@/types/expense';
import { CATEGORY_CONFIG } from '@/utils/constants';
import { Modal } from '../ui/Modal';
import { CategoryIcon } from '../ui/CategoryIcon';
import {
  Target,
  AlertCircle,
  CheckCircle2,
  Sliders,
} from 'lucide-react';

export const BudgetProgress: React.FC = () => {
  const { budget, updateBudget, summary, currency } = useExpenses();
  const { showSuccess } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [overallBudget, setOverallBudget] = useState(budget.overallMonthly);
  const [categoryBudgets, setCategoryBudgets] = useState<Record<Category, number>>(
    budget.categoryBudgets
  );

  const spentThisMonth = summary.thisMonthSpent;
  const overallTarget = budget.overallMonthly || 2500;
  const overallPercentage = Math.round((spentThisMonth / overallTarget) * 100);
  const remaining = overallTarget - spentThisMonth;
  const isOverBudget = remaining < 0;

  const handleOpenModal = () => {
    setOverallBudget(budget.overallMonthly);
    setCategoryBudgets({ ...budget.categoryBudgets });
    setIsModalOpen(true);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const newSettings: BudgetSettings = {
      overallMonthly: overallBudget,
      categoryBudgets: { ...categoryBudgets },
    };
    updateBudget(newSettings);
    showSuccess('Budget limits updated successfully!');
    setIsModalOpen(false);
  };

  // Get status color based on percentage
  const getProgressColor = (pct: number) => {
    if (pct > 100) return 'bg-rose-500';
    if (pct > 85) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Monthly Budget Tracker
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Plan and monitor monthly spending limits
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            Adjust Budgets
          </button>
        </div>

        {/* Overall Budget Progress Bar */}
        <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Overall Monthly Target
              </span>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {formatCurrency(spentThisMonth, currency)}{' '}
                <span className="text-xs font-normal text-slate-400">
                  / {formatCurrency(overallTarget, currency)}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                  isOverBudget
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                {isOverBudget ? (
                  <>
                    <AlertCircle className="w-3 h-3" /> Over by{' '}
                    {formatCurrency(Math.abs(remaining), currency)}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3" />{' '}
                    {formatCurrency(remaining, currency)} left
                  </>
                )}
              </span>
              <div className="text-xs text-slate-400 mt-1 font-medium">
                {overallPercentage}% utilized
              </div>
            </div>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(
                overallPercentage
              )}`}
              style={{ width: `${Math.min(overallPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Category Budget Breakdown List */}
        <div className="space-y-3 pt-1">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Category Spending vs Target
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CATEGORIES.map((cat) => {
              const catConfig = CATEGORY_CONFIG[cat];
              const target = budget.categoryBudgets[cat] || catConfig.defaultMonthlyBudget;
              const catSummary = summary.categoryBreakdown.find((c) => c.category === cat);
              const spent = catSummary ? catSummary.amount : 0;
              const pct = target > 0 ? Math.round((spent / target) * 100) : 0;

              return (
                <div
                  key={cat}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                      <CategoryIcon category={cat} className="w-3.5 h-3.5" style={{ color: catConfig.hexColor }} />
                      <span>{cat}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(spent, currency)}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">
                        / {formatCurrency(target, currency)}
                      </span>
                    </span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getProgressColor(
                        pct
                      )}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Adjust Budget Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Adjust Monthly Budget Limits"
        description="Set your target spending thresholds to keep personal finances on track"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveBudget} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Overall Total Monthly Budget
            </label>
            <input
              type="number"
              min="0"
              step="10"
              value={overallBudget}
              onChange={(e) => setOverallBudget(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              required
            />
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Category Targets
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CATEGORIES.map((cat) => (
                <div key={cat}>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {cat}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={categoryBudgets[cat] ?? 0}
                    onChange={(e) =>
                      setCategoryBudgets((prev) => ({
                        ...prev,
                        [cat]: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20"
            >
              Save Budget Settings
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

'use client';

import React, { useState } from 'react';
import { useExpenses } from '@/context/ExpenseContext';
import { Navbar, NavTab } from '@/components/layout/Navbar';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { SpendingCharts } from '@/components/dashboard/SpendingCharts';
import { BudgetProgress } from '@/components/dashboard/BudgetProgress';
import { RecentExpenses } from '@/components/dashboard/RecentExpenses';
import { ExpenseFiltersBar } from '@/components/expenses/ExpenseFilters';
import { ExpenseList } from '@/components/expenses/ExpenseList';
import { ExpenseFormModal } from '@/components/expenses/ExpenseFormModal';
import { ExpenseExportImportModal } from '@/components/expenses/ExpenseExportImport';
import { formatCurrency } from '@/utils/formatters';
import { monthlySpendingComparison } from '@/utils/expenseStats';
import {
  Plus,
  LayoutDashboard,
  ReceiptText,
  Target,
  Sparkles,
  TrendingDown,
  ShieldCheck,
  Zap,
  ArrowUpRight,
} from 'lucide-react';
import { format } from 'date-fns';

export default function HomePage() {
  const { isLoading, expenses, summary, currency } = useExpenses();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const todayFormatted = format(new Date(), 'EEEE, MMMM d, yyyy');
  const spendingComparison = monthlySpendingComparison(
    summary.thisMonthSpent,
    summary.monthlyChangePercent
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#090d16] text-slate-500">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Loading ExpenseFlow...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 pb-24 md:pb-12">
        {/* Header Greeting Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personal Finance Overview</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {activeTab === 'dashboard' && 'Financial Dashboard'}
              {activeTab === 'expenses' && 'Expense Transactions'}
              {activeTab === 'budget' && 'Budgets & Financial Goals'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {todayFormatted} • Tracking {expenses.length} expenses
            </p>
          </div>

          {/* Quick Action on Header */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold shadow-md shadow-indigo-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Record Expense</span>
            </button>
          </div>
        </div>

        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 sm:space-y-8">
            {/* Top Metric Cards */}
            <SummaryCards />

            {/* Middle Grid: Charts & Sidebar Widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (8 Cols): Charts & Budget Bar */}
              <div className="lg:col-span-8 space-y-6">
                <SpendingCharts />
                <BudgetProgress />
              </div>

              {/* Right Column (4 Cols): Recent Activity & Quick Insights */}
              <div className="lg:col-span-4 space-y-6">
                <RecentExpenses
                  onViewAllClick={() => setActiveTab('expenses')}
                  onAddExpenseClick={() => setIsAddModalOpen(true)}
                />

                {/* Financial Health / Insights Widget */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white shadow-lg shadow-indigo-500/15 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-white/20">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="font-bold text-sm">Monthly Spending Insight</h4>
                  </div>
                  <p className="text-xs text-indigo-100 leading-relaxed">
                    {spendingComparison !== 'none' ? (
                      <>
                        You have spent <strong>{formatCurrency(summary.thisMonthSpent, currency)}</strong> this month.
                        {spendingComparison === 'lower' && (
                          <span> Great job keeping expenses lower than last month!</span>
                        )}
                        {spendingComparison === 'higher' && (
                          <span> Spending is currently {Math.abs(summary.monthlyChangePercent).toFixed(1)}% higher than last month.</span>
                        )}
                      </>
                    ) : (
                      'Log daily transactions to unlock smart financial analytics and spending habits trends.'
                    )}
                  </p>
                  <button
                    onClick={() => setActiveTab('expenses')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <span>Analyze all transactions</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EXPENSES LIST & FILTERS */}
        {activeTab === 'expenses' && (
          <div className="space-y-6">
            <ExpenseFiltersBar />
            <ExpenseList onOpenAddModal={() => setIsAddModalOpen(true)} />
          </div>
        )}

        {/* TAB 3: BUDGETS & GOALS */}
        {activeTab === 'budget' && (
          <div className="space-y-6">
            <BudgetProgress />
            <SpendingCharts />

            {/* Smart Budget Advice Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  50/30/20 Rule
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Aim to allocate 50% of income to essential bills, 30% to wants and entertainment, and 20% to savings.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Recurring Subscriptions
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Regularly audit streaming and utility bills. Filter by category &quot;Bills&quot; or &quot;Entertainment&quot; to spot recurring charges.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Category Limits
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Setting specific category caps prevents overspending before it occurs. Use the Adjust Budgets tool to tune targets.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button for Mobile */}
      <div className="md:hidden fixed bottom-20 right-5 z-30">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-14 h-14 rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition-all"
          aria-label="Add new expense"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'dashboard'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'expenses'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <ReceiptText className="w-5 h-5" />
          <span>Expenses</span>
        </button>
        <button
          onClick={() => setActiveTab('budget')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'budget'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Target className="w-5 h-5" />
          <span>Budgets</span>
        </button>
      </nav>

      {/* Add / Edit Expense Modal */}
      <ExpenseFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        initialData={null}
      />

      {/* Export / Backup Modal */}
      <ExpenseExportImportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}

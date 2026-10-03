'use client';

import React, { useState } from 'react';
import { Expense } from '@/types/expense';
import { useExpenses } from '@/context/ExpenseContext';
import { formatCurrency, formatDate, formatRelativeDate } from '@/utils/formatters';
import { CategoryBadge } from '../ui/CategoryBadge';
import { ExpenseFormModal } from './ExpenseFormModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import {
  Edit2,
  Trash2,
  FileQuestion,
  Plus,
  RotateCcw,
  CreditCard,
  FileText,
  Calendar,
} from 'lucide-react';

interface ExpenseListProps {
  onOpenAddModal?: () => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({ onOpenAddModal }) => {
  const { filteredExpenses, expenses, currency, resetFilters, resetToSample } = useExpenses();

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleEditClick = (expense: Expense) => {
    setEditingExpense(expense);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (expense: Expense) => {
    setDeletingExpense(expense);
    setIsDeleteModalOpen(true);
  };

  // Group filtered expenses by Date
  const groupedExpenses = React.useMemo(() => {
    const map = new Map<string, Expense[]>();
    filteredExpenses.forEach((item) => {
      const existing = map.get(item.date) || [];
      existing.push(item);
      map.set(item.date, existing);
    });
    return Array.from(map.entries());
  }, [filteredExpenses]);

  // Empty state when no expenses exist at all
  if (expenses.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-10 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400">
          <FileQuestion className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No Expenses Recorded Yet
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            Start tracking your financial transactions or load sample data to explore analytics and reports.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {onOpenAddModal && (
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-md shadow-indigo-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add First Expense
            </button>
          )}
          <button
            onClick={resetToSample}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-sm transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Load Sample Demo Data
          </button>
        </div>
      </div>
    );
  }

  // Empty state when filters return 0 results
  if (filteredExpenses.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-10 text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/60 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
          <RotateCcw className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No Expenses Match Filters
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            Try adjusting your search terms, date range, or category filters.
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-medium text-sm transition-all shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Clear All Filters
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/75 dark:bg-slate-800/40 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-5">Date</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-5 text-right">Amount</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
              {filteredExpenses.map((expense) => (
                <tr
                  key={expense.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Date */}
                  <td className="py-4 px-5 whitespace-nowrap">
                    <div className="font-medium text-slate-900 dark:text-slate-200">
                      {formatDate(expense.date, 'MMM dd, yyyy')}
                    </div>
                    <div className="text-xs text-slate-400">
                      {formatRelativeDate(expense.date)}
                    </div>
                  </td>

                  {/* Description & Notes */}
                  <td className="py-4 px-4 max-w-xs">
                    <div className="font-semibold text-slate-900 dark:text-white truncate">
                      {expense.description}
                    </div>
                    {expense.notes && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 flex items-center gap-1">
                        <FileText className="w-3 h-3 flex-shrink-0 text-slate-400" />
                        <span>{expense.notes}</span>
                      </div>
                    )}
                  </td>

                  {/* Category */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <CategoryBadge category={expense.category} size="md" />
                  </td>

                  {/* Payment Method */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    {expense.paymentMethod ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                        <CreditCard className="w-3 h-3 text-slate-400" />
                        {expense.paymentMethod}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>

                  {/* Amount */}
                  <td className="py-4 px-5 whitespace-nowrap text-right font-bold text-slate-900 dark:text-white">
                    {formatCurrency(expense.amount, currency)}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditClick(expense)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-950/60 transition-colors"
                        title="Edit expense"
                        aria-label={`Edit ${expense.description}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(expense)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/60 transition-colors"
                        title="Delete expense"
                        aria-label={`Delete ${expense.description}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile / Compact Cards List */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {groupedExpenses.map(([dateKey, items]) => {
            const dayTotal = items.reduce((sum, item) => sum + item.amount, 0);

            return (
              <div key={dateKey} className="p-4 space-y-3">
                {/* Date Group Header */}
                <div className="flex items-center justify-between pb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {formatDate(dateKey, 'EEEE, MMM d')}
                  </span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {formatCurrency(dayTotal, currency)}
                  </span>
                </div>

                {/* Items for this date */}
                <div className="space-y-2.5">
                  {items.map((expense) => (
                    <div
                      key={expense.id}
                      className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                            {expense.description}
                          </h4>
                          {expense.notes && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                              {expense.notes}
                            </p>
                          )}
                        </div>
                        <span className="font-bold text-base text-slate-900 dark:text-white whitespace-nowrap">
                          {formatCurrency(expense.amount, currency)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                        <div className="flex items-center gap-2">
                          <CategoryBadge category={expense.category} size="sm" />
                          {expense.paymentMethod && (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {expense.paymentMethod}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditClick(expense)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                            aria-label={`Edit ${expense.description}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(expense)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                            aria-label={`Delete ${expense.description}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Modal */}
      <ExpenseFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingExpense(null);
        }}
        initialData={editingExpense}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingExpense(null);
        }}
        expense={deletingExpense}
      />
    </>
  );
};

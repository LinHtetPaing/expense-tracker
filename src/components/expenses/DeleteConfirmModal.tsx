'use client';

import React from 'react';
import { Expense } from '@/types/expense';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { useExpenses } from '@/context/ExpenseContext';
import { useToast } from '@/context/ToastContext';
import { Modal } from '../ui/Modal';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { CategoryBadge } from '../ui/CategoryBadge';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  expense,
}) => {
  const { deleteExpense, currency } = useExpenses();
  const { showSuccess, showError } = useToast();

  if (!expense) return null;

  const handleDelete = () => {
    try {
      const success = deleteExpense(expense.id);
      if (success) {
        showSuccess(`Deleted "${expense.description}"`);
        onClose();
      } else {
        showError('Could not find expense to delete');
      }
    } catch {
      showError('Failed to delete expense');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Expense"
      maxWidth="sm"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 rounded-xl text-rose-800 dark:text-rose-300">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <p className="text-sm font-medium">
            Are you sure you want to delete this expense record? This action cannot be undone.
          </p>
        </div>

        {/* Transaction Summary Card */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-base">
                {expense.description}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatDate(expense.date)}
              </p>
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {formatCurrency(expense.amount, currency)}
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
            <CategoryBadge category={expense.category} size="sm" />
            {expense.paymentMethod && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                • {expense.paymentMethod}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-md shadow-rose-500/20 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            Delete Expense
          </button>
        </div>
      </div>
    </Modal>
  );
};

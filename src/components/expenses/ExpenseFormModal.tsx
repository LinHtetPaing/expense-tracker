'use client';

import React, { useState, useEffect } from 'react';
import { Category, CATEGORIES, Expense, ExpenseFormData, PaymentMethod, PAYMENT_METHODS } from '@/types/expense';
import { useExpenses } from '@/context/ExpenseContext';
import { useToast } from '@/context/ToastContext';
import { CURRENCIES, CATEGORY_CONFIG } from '@/utils/constants';
import { Modal } from '../ui/Modal';
import { CategoryIcon } from '../ui/CategoryIcon';
import { Calendar, CreditCard, FileText, Plus, Check } from 'lucide-react';
import { format } from 'date-fns';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Expense | null;
}

interface FormErrors {
  description?: string;
  amount?: string;
  category?: string;
  date?: string;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const { addExpense, updateExpense, currency } = useExpenses();
  const { showSuccess, showError } = useToast();

  const isEditing = Boolean(initialData);
  const currencyConfig = CURRENCIES[currency] || CURRENCIES.USD;

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('Food');
  const [date, setDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Credit Card');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync initialData when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDescription(initialData.description);
        setAmount(initialData.amount.toString());
        setCategory(initialData.category);
        setDate(initialData.date);
        setPaymentMethod(initialData.paymentMethod || 'Credit Card');
        setNotes(initialData.notes || '');
      } else {
        // Default new expense values
        setDescription('');
        setAmount('');
        setCategory('Food');
        setDate(format(new Date(), 'yyyy-MM-dd'));
        setPaymentMethod('Credit Card');
        setNotes('');
      }
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, initialData]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    } else if (description.trim().length > 100) {
      newErrors.description = 'Description cannot exceed 100 characters';
    }

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount)) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (parsedAmount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    } else if (parsedAmount > 1000000) {
      newErrors.amount = 'Amount cannot exceed $1,000,000';
    }

    if (!category || !CATEGORIES.includes(category)) {
      newErrors.category = 'Please select a valid category';
    }

    if (!date) {
      newErrors.date = 'Date is required';
    } else if (isNaN(Date.parse(date))) {
      newErrors.date = 'Please enter a valid date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    const formData: ExpenseFormData = {
      description: description.trim(),
      amount: Math.round(parseFloat(amount) * 100) / 100,
      category,
      date,
      paymentMethod,
      notes: notes.trim() ? notes.trim() : undefined,
    };

    try {
      if (isEditing && initialData) {
        updateExpense(initialData.id, formData);
        showSuccess(`Updated "${formData.description}" successfully!`);
      } else {
        addExpense(formData);
        showSuccess(`Added "${formData.description}" for ${currencyConfig.symbol}${formData.amount.toFixed(2)}`);
      }
      onClose();
    } catch {
      showError('Failed to save expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Expense' : 'Add New Expense'}
      description={
        isEditing
          ? 'Modify details of this expense transaction'
          : 'Record a new expense to track your personal spending'
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Description Field */}
        <div>
          <label
            htmlFor="expense-description"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Description <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <FileText className="w-4 h-4" />
            </div>
            <input
              id="expense-description"
              type="text"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
              }}
              placeholder="e.g., Grocery Shopping, Monthly Subway Pass"
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                errors.description
                  ? 'border-rose-400 focus:ring-rose-200 dark:border-rose-600 dark:focus:ring-rose-900/50'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20 focus:border-indigo-500'
              }`}
              maxLength={100}
              required
            />
          </div>
          {errors.description && (
            <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
              {errors.description}
            </p>
          )}
        </div>

        {/* Amount & Date in a 2-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Amount Field */}
          <div>
            <label
              htmlFor="expense-amount"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Amount ({currencyConfig.code}) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-semibold text-sm">
                {currencyConfig.symbol}
              </div>
              <input
                id="expense-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount) setErrors((prev) => ({ ...prev, amount: undefined }));
                }}
                placeholder="0.00"
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 font-medium focus:outline-none focus:ring-2 transition-all ${
                  errors.amount
                    ? 'border-rose-400 focus:ring-rose-200 dark:border-rose-600 dark:focus:ring-rose-900/50'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20 focus:border-indigo-500'
                }`}
                required
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                {errors.amount}
              </p>
            )}
          </div>

          {/* Date Picker Field */}
          <div>
            <label
              htmlFor="expense-date"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                id="expense-date"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (errors.date) setErrors((prev) => ({ ...prev, date: undefined }));
                }}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.date
                    ? 'border-rose-400 focus:ring-rose-200 dark:border-rose-600 dark:focus:ring-rose-900/50'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20 focus:border-indigo-500'
                }`}
                required
              />
            </div>
            {errors.date && (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                {errors.date}
              </p>
            )}
          </div>
        </div>

        {/* Category Picker (Interactive Visual Grid) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Category <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {CATEGORIES.map((cat) => {
              const config = CATEGORY_CONFIG[cat];
              const isSelected = category === cat;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategory(cat);
                    if (errors.category) setErrors((prev) => ({ ...prev, category: undefined }));
                  }}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                    isSelected
                      ? `${config.bgLight} ${config.borderLight} ring-2 ring-indigo-500/40 shadow-sm`
                      : 'border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg ${
                      isSelected
                        ? 'bg-white dark:bg-slate-900'
                        : 'bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <CategoryIcon category={cat} className="w-4 h-4" />
                  </div>
                  <span className="truncate flex-1">{config.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                </button>
              );
            })}
          </div>
          {errors.category && (
            <p className="mt-1 text-xs text-rose-500">{errors.category}</p>
          )}
        </div>

        {/* Payment Method Selector */}
        <div>
          <label
            htmlFor="expense-payment-method"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Payment Method
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <CreditCard className="w-4 h-4" />
            </div>
            <select
              id="expense-payment-method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Optional Notes */}
        <div>
          <label
            htmlFor="expense-notes"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Notes / Tags <span className="text-slate-400 text-xs">(Optional)</span>
          </label>
          <textarea
            id="expense-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add additional context, receipt details, or tags..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none text-sm"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isEditing ? (
              <>Save Changes</>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add Expense
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

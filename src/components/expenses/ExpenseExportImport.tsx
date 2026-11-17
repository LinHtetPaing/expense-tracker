'use client';

import React, { useState, useRef } from 'react';
import { useExpenses } from '@/context/ExpenseContext';
import { useToast } from '@/context/ToastContext';
import {
  expenseExportSelection,
  exportExpensesToCSV,
  exportExpensesToJSON,
  parseJSONExpensesFile,
} from '@/utils/csvExport';
import { Modal } from '../ui/Modal';
import {
  FileSpreadsheet,
  FileCode,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react';

interface ExpenseExportImportProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExpenseExportImportModal: React.FC<ExpenseExportImportProps> = ({
  isOpen,
  onClose,
}) => {
  const { expenses, filteredExpenses, importExpenses, resetToSample, clearAllData } = useExpenses();
  const { showSuccess, showError, showWarning } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [exportScope, setExportScope] = useState<'all' | 'filtered'>('all');

  const exportSelection = expenseExportSelection(exportScope, expenses, filteredExpenses);

  const handleExportCSV = () => {
    try {
      if (exportSelection.csvExpenses.length === 0) {
        showWarning('No expenses to export.');
        return;
      }
      exportExpensesToCSV(exportSelection.csvExpenses, exportSelection.csvFilenamePrefix);
      showSuccess(`Exported ${exportSelection.csvExpenses.length} expenses to CSV`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to export CSV';
      showError(message);
    }
  };

  const handleExportJSON = () => {
    try {
      if (exportSelection.jsonExpenses.length === 0) {
        showWarning('No expenses to export.');
        return;
      }
      exportExpensesToJSON(exportSelection.jsonExpenses);
      showSuccess(`Backed up ${exportSelection.jsonExpenses.length} expenses to JSON`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to export JSON backup';
      showError(message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const imported = await parseJSONExpensesFile(file);
      importExpenses(imported);
      showSuccess(`Successfully imported ${imported.length} expenses!`);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to parse import file';
      showError(message);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleResetSample = () => {
    if (window.confirm('Reset all expense data to sample demonstration data?')) {
      resetToSample();
      showSuccess('Reset to sample expenses!');
      onClose();
    }
  };

  const handleClearAll = () => {
    if (
      window.confirm(
        'Warning: This will permanently delete ALL expense records. Are you sure?'
      )
    ) {
      clearAllData();
      showWarning('All expense records cleared');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Data Management & Export"
      description="Export your financial logs to spreadsheet/backup or import past backups"
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* Export Section */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Export Data
          </h4>

          {/* Export Scope Toggle */}
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-300">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="exportScope"
                checked={exportScope === 'all'}
                onChange={() => setExportScope('all')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span>All recorded expenses ({expenses.length})</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="exportScope"
                checked={exportScope === 'filtered'}
                onChange={() => setExportScope('filtered')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span>Current filtered view ({filteredExpenses.length})</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={exportSelection.csvExpenses.length === 0}
              className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/30 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Export to CSV
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Excel & Sheets compatible
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={handleExportJSON}
              disabled={exportSelection.jsonExpenses.length === 0}
              className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/30 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Export Backup (JSON)
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Full data structure
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Import Backup
          </h4>
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm font-medium transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>{isImporting ? 'Processing file...' : 'Choose JSON Backup File to Restore'}</span>
          </button>
        </div>

        {/* Demo & Data Management Options */}
        <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Demo & Maintenance
          </h4>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleResetSample}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Sample Data
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All Data
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

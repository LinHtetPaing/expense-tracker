'use client';

import React, { useState } from 'react';
import { Category, CATEGORIES, DateRangePreset, SortOption } from '@/types/expense';
import { useExpenses } from '@/context/ExpenseContext';
import { CATEGORY_CONFIG } from '@/utils/constants';
import {
  Search,
  X,
  SlidersHorizontal,
  ChevronDown,
  ArrowUpDown,
  RotateCcw,
} from 'lucide-react';

export const ExpenseFiltersBar: React.FC = () => {
  const { filters, updateFilterField, resetFilters, filteredExpenses, expenses } =
    useExpenses();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const isFiltered =
    filters.search !== '' ||
    filters.category !== 'all' ||
    filters.datePreset !== 'all' ||
    filters.startDate !== '' ||
    filters.endDate !== '' ||
    filters.minAmount !== undefined ||
    filters.maxAmount !== undefined ||
    filters.sortBy !== 'date_desc';

  const datePresets: Array<{ id: DateRangePreset; label: string }> = [
    { id: 'all', label: 'All Time' },
    { id: 'today', label: 'Today' },
    { id: 'this_week', label: 'This Week' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'this_year', label: 'This Year' },
    { id: 'custom', label: 'Custom Range' },
  ];

  const sortOptions: Array<{ id: SortOption; label: string }> = [
    { id: 'date_desc', label: 'Date: Newest First' },
    { id: 'date_asc', label: 'Date: Oldest First' },
    { id: 'amount_desc', label: 'Amount: High to Low' },
    { id: 'amount_asc', label: 'Amount: Low to High' },
    { id: 'description_asc', label: 'Description (A - Z)' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Top Search & Primary Filters Row */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => updateFilterField('search', e.target.value)}
            placeholder="Search by description, notes, category..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          {filters.search && (
            <button
              onClick={() => updateFilterField('search', '')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Clear search query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative min-w-[150px] flex-1 sm:flex-initial">
            <select
              value={filters.category}
              onChange={(e) => updateFilterField('category', e.target.value as 'all' | Category)}
              className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_CONFIG[cat].label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="relative min-w-[180px] flex-1 sm:flex-initial">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <ArrowUpDown className="w-3.5 h-3.5" />
            </div>
            <select
              value={filters.sortBy}
              onChange={(e) => updateFilterField('sortBy', e.target.value as SortOption)}
              className="w-full pl-8 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer"
            >
              {sortOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>

          {/* Advanced Filters Toggle Button */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`p-2.5 rounded-xl border transition-colors flex items-center gap-1.5 text-sm font-medium ${
              showAdvanced || filters.minAmount !== undefined || filters.maxAmount !== undefined || filters.datePreset === 'custom'
                ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            title="More filters"
            aria-label="More filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Reset Filters Button */}
          {isFiltered && (
            <button
              type="button"
              onClick={resetFilters}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              title="Reset all filters"
              aria-label="Reset all filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Date Preset Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1 hidden sm:inline-block">
          Timeframe:
        </span>
        {datePresets.map((preset) => {
          const isSelected = filters.datePreset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => updateFilterField('datePreset', preset.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Advanced Collapsible Filter Row (Custom Date & Amount Range) */}
      {(showAdvanced || filters.datePreset === 'custom') && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in">
          {/* Start Date */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => {
                updateFilterField('startDate', e.target.value);
                if (filters.datePreset !== 'custom') {
                  updateFilterField('datePreset', 'custom');
                }
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => {
                updateFilterField('endDate', e.target.value);
                if (filters.datePreset !== 'custom') {
                  updateFilterField('datePreset', 'custom');
                }
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Min Amount */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Min Amount
            </label>
            <input
              type="number"
              min="0"
              placeholder="0.00"
              value={filters.minAmount !== undefined ? filters.minAmount : ''}
              onChange={(e) =>
                updateFilterField(
                  'minAmount',
                  e.target.value === '' ? undefined : parseFloat(e.target.value)
                )
              }
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Max Amount */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Max Amount
            </label>
            <input
              type="number"
              min="0"
              placeholder="No limit"
              value={filters.maxAmount !== undefined ? filters.maxAmount : ''}
              onChange={(e) =>
                updateFilterField(
                  'maxAmount',
                  e.target.value === '' ? undefined : parseFloat(e.target.value)
                )
              }
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>
      )}

      {/* Filter status & result summary */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
        <span>
          Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{filteredExpenses.length}</span> of{' '}
          <span className="font-semibold text-slate-800 dark:text-slate-200">{expenses.length}</span> expenses
        </span>
        {isFiltered && (
          <span className="text-indigo-600 dark:text-indigo-400 font-medium">
            Active filters applied
          </span>
        )}
      </div>
    </div>
  );
};

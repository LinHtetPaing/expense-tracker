'use client';

import React, { useState, useMemo } from 'react';
import { useExpenses } from '@/context/ExpenseContext';
import { formatCurrency } from '@/utils/formatters';
import { CATEGORY_CONFIG } from '@/utils/constants';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import {
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  Layers,
} from 'lucide-react';
import { format, subDays, startOfMonth, subMonths } from 'date-fns';

export const SpendingCharts: React.FC = () => {
  const { summary, expenses, currency } = useExpenses();
  const [activeTab, setActiveTab] = useState<'category' | 'trend' | 'monthly'>('category');

  // 1. Data for Category Breakdown (Donut Chart)
  const categoryData = useMemo(() => {
    return summary.categoryBreakdown
      .filter((item) => item.amount > 0)
      .map((item) => ({
        name: item.category,
        value: item.amount,
        percentage: item.percentage,
        count: item.count,
        color: CATEGORY_CONFIG[item.category]?.hexColor || '#64748b',
      }));
  }, [summary.categoryBreakdown]);

  // 2. Data for Daily Spending Trend (Last 14 Days)
  const dailyTrendData = useMemo(() => {
    const today = new Date();
    const days: Array<{ dateStr: string; label: string; amount: number; count: number }> = [];

    for (let i = 13; i >= 0; i--) {
      const d = subDays(today, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const label = format(d, 'MMM d');

      const dayExpenses = expenses.filter((exp) => exp.date === dateStr);
      const totalAmount = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);

      days.push({
        dateStr,
        label,
        amount: Math.round(totalAmount * 100) / 100,
        count: dayExpenses.length,
      });
    }

    return days;
  }, [expenses]);

  // 3. Data for Monthly Comparison (Last 6 Months)
  const monthlyData = useMemo(() => {
    const today = new Date();
    const months: Array<{ monthStr: string; label: string; amount: number; count: number }> = [];

    for (let i = 5; i >= 0; i--) {
      const mDate = subMonths(today, i);
      const mStart = startOfMonth(mDate);
      const monthPrefix = format(mStart, 'yyyy-MM');
      const label = format(mStart, 'MMM yyyy');

      const monthExpenses = expenses.filter((exp) => exp.date.startsWith(monthPrefix));
      const totalAmount = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

      months.push({
        monthStr: monthPrefix,
        label,
        amount: Math.round(totalAmount * 100) / 100,
        count: monthExpenses.length,
      });
    }

    return months;
  }, [expenses]);

  // Custom Chart Tooltips
  interface CategoryTooltipPayload {
    name: string;
    value: number;
    percentage: number;
    count: number;
    color: string;
  }

  const CustomCategoryTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: CategoryTooltipPayload }>;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2.5 rounded-xl text-xs shadow-xl border border-slate-700">
          <div className="flex items-center gap-2 font-semibold">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: data.color }}
            />
            <span>{data.name}</span>
          </div>
          <div className="mt-1 text-slate-200">
            <span className="font-bold text-white text-sm">
              {formatCurrency(data.value, currency)}
            </span>{' '}
            ({data.percentage}%)
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {data.count} {data.count === 1 ? 'transaction' : 'transactions'}
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number; payload: { count?: number } }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const amount = payload[0].value;
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2.5 rounded-xl text-xs shadow-xl border border-slate-700">
          <p className="font-semibold text-slate-300">{label}</p>
          <p className="font-bold text-white text-sm mt-0.5">
            {formatCurrency(amount, currency)}
          </p>
          {data.count !== undefined && (
            <p className="text-[11px] text-slate-400 mt-0.5">
              {data.count} {data.count === 1 ? 'transaction' : 'transactions'}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Chart Header & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            Spending Analytics & Visuals
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Interactive breakdown and historical trends
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('category')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'category'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            Categories
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('trend')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'trend'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            14-Day Trend
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('monthly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'monthly'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Monthly
          </button>
        </div>
      </div>

      {/* Empty State if No Expenses */}
      {expenses.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
          <Layers className="w-10 h-10 stroke-1 opacity-60" />
          <p className="text-sm font-medium">No spending data available to chart</p>
          <p className="text-xs">Add expenses to visualize your cashflow breakdown</p>
        </div>
      ) : (
        <>
          {/* 1. Category Breakdown (Donut Chart + Legend) */}
          {activeTab === 'category' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-6 h-64 sm:h-72 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomCategoryTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category Breakdown Progress Bars List */}
              <div className="lg:col-span-6 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Category Distribution
                </h4>
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {categoryData.map((item) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {formatCurrency(item.value, currency)}
                          </span>
                          <span className="text-slate-400 font-medium">({item.percentage}%)</span>
                        </div>
                      </div>
                      {/* Progress Track */}
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(item.percentage, 100)}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. 14-Day Trend Chart (Area Chart) */}
          {activeTab === 'trend' && (
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33415520" />
                  <XAxis
                    dataKey="label"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#spendingGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 3. Monthly Spending Comparison (Bar Chart) */}
          {activeTab === 'monthly' && (
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33415520" />
                  <XAxis
                    dataKey="label"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar
                    dataKey="amount"
                    fill="#4f46e5"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
};

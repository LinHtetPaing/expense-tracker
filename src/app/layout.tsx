import type { Metadata } from 'next';
import './globals.css';
import { ExpenseProvider } from '@/context/ExpenseContext';
import { ToastProvider } from '@/context/ToastContext';
import { ThemeProvider } from '@/context/ThemeContext';

export const metadata: Metadata = {
  title: 'ExpenseFlow — Smart Personal Expense Tracker',
  description:
    'A modern, professional personal finance and expense tracking application with analytics, charts, budgets, and CSV export.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 antialiased transition-colors duration-200">
        <ThemeProvider>
          <ToastProvider>
            <ExpenseProvider>{children}</ExpenseProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

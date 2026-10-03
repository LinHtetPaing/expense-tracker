'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastItem = { id, type, title, message, duration };
      
      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const showSuccess = useCallback((message: string, title?: string) => {
    addToast({ type: 'success', title: title || 'Success', message });
  }, [addToast]);

  const showError = useCallback((message: string, title?: string) => {
    addToast({ type: 'error', title: title || 'Error', message, duration: 6000 });
  }, [addToast]);

  const showInfo = useCallback((message: string, title?: string) => {
    addToast({ type: 'info', title: title || 'Info', message });
  }, [addToast]);

  const showWarning = useCallback((message: string, title?: string) => {
    addToast({ type: 'warning', title: title || 'Warning', message });
  }, [addToast]);

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, showSuccess, showError, showInfo, showWarning }}
    >
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const ToastContainer: React.FC<{ toasts: ToastItem[]; onClose: (id: string) => void }> = ({
  toasts,
  onClose,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 sm:px-0 pointer-events-none"
    >
      {toasts.map((toast) => {
        let bgClass = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100';
        let icon = <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />;

        if (toast.type === 'success') {
          bgClass = 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-800/80';
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />;
        } else if (toast.type === 'error') {
          bgClass = 'bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-800/80';
          icon = <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />;
        } else if (toast.type === 'warning') {
          bgClass = 'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-800/80';
          icon = <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 transform translate-y-0 ${bgClass}`}
          >
            {icon}
            <div className="flex-1 min-w-0">
              {toast.title && (
                <h4 className="text-sm font-semibold leading-none mb-1 text-slate-900 dark:text-white">
                  {toast.title}
                </h4>
              )}
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => onClose(toast.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 -mr-1 -mt-1 rounded-lg"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

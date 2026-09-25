'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'success', duration = 3500) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Floating Toasts Container (Mobile-First Centered) */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 w-full max-w-[440px] px-4 z-[9999] pointer-events-none flex flex-col gap-2">
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-3 p-3.5 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-fade-in ${
                isSuccess
                  ? 'bg-emerald-600/95 text-white border-emerald-500/50 shadow-emerald-900/20'
                  : isError
                  ? 'bg-rose-600/95 text-white border-rose-500/50 shadow-rose-900/20'
                  : 'bg-slate-800/95 text-white border-slate-700/50 shadow-slate-900/20'
              }`}
            >
              <div className="shrink-0">
                {isSuccess && <CheckCircle2 size={20} className="text-white" />}
                {isError && <AlertCircle size={20} className="text-white" />}
                {!isSuccess && !isError && <Info size={20} className="text-white" />}
              </div>
              <div className="flex-1 text-sm font-medium leading-snug">
                {t.message}
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="btn btn-ghost btn-circle btn-xs text-white/80 hover:text-white shrink-0"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

type ToastVariant = 'default' | 'success' | 'error' | 'warning';

type ToastItem = {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastContextValue = {
  toast: (input: ToastInput) => number;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<number, number>>(new Map());

  const dismiss = (id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const toast = (input: ToastInput) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const signature = `${input.variant || 'default'}:${input.title}:${input.description || ''}`;
    setToasts(prev => {
      const existing = prev.find(item => `${item.variant}:${item.title}:${item.description || ''}` === signature);
      if (existing) {
        const timer = timers.current.get(existing.id);
        if (timer) window.clearTimeout(timer);
        timers.current.delete(existing.id);
        timers.current.set(existing.id, window.setTimeout(() => dismiss(existing.id), 3500));
        return [existing, ...prev.filter(item => item.id !== existing.id)].slice(0, 4);
      }

      const next = [
        ...prev.filter(item => `${item.variant}:${item.title}:${item.description || ''}` !== signature),
        {
          id,
          title: input.title,
          description: input.description,
          variant: input.variant || 'default',
        },
      ].slice(-4);

      timers.current.set(id, window.setTimeout(() => dismiss(id), 3500));
      return next;
    });
    return id;
  };

  const value = useMemo(() => ({ toast, dismiss }), []);

  useEffect(() => () => {
    timers.current.forEach(timer => window.clearTimeout(timer));
    timers.current.clear();
  }, []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 sm:top-6 sm:right-6">
        {toasts.map(item => (
          <div
            key={item.id}
            role={item.variant === 'error' ? 'alert' : 'status'}
            aria-live={item.variant === 'error' ? 'assertive' : 'polite'}
            className={`rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md animate-fadeIn ${
              item.variant === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-100'
                : item.variant === 'error'
                ? 'bg-rose-500/15 border-rose-500/25 text-rose-100'
                : item.variant === 'warning'
                ? 'bg-amber-500/15 border-amber-500/25 text-amber-100'
                : 'bg-[#111118] border-white/[0.08] text-white'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold leading-tight">{item.title}</div>
                {item.description && <div className="mt-1 text-xs text-slate-300 leading-relaxed">{item.description}</div>}
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismiss(item.id)}
                className="shrink-0 rounded-md border border-white/[0.08] px-2 py-1 text-xs text-slate-300 hover:text-white hover:bg-white/[0.05]"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

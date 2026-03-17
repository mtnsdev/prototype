"use client";

import { createContext, useCallback, useContext, useState } from "react";

type ToastMessage = { id: number; text: string };

const ToastContext = createContext<((text: string) => void) | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback((text: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="rounded-lg bg-[#1a1a1a] border border-white/20 text-[#F5F5F5] px-4 py-2 text-sm shadow-lg"
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): (text: string) => void {
  const ctx = useContext(ToastContext);
  return ctx ?? (() => {});
}

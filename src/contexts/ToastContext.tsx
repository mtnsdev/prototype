"use client";

import { createContext, useCallback, useContext, useState } from "react";

export type ToastInput =
  | string
  | { title: string; description?: string; duration?: number };

type ToastMessage =
  | { id: number; kind: "text"; text: string; duration: number }
  | { id: number; kind: "rich"; title: string; description?: string; duration: number };

const ToastContext = createContext<((input: ToastInput) => void) | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback((input: ToastInput) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const duration =
      typeof input === "string" ? 3000 : Math.max(2000, input.duration ?? 4000);
    const entry: ToastMessage =
      typeof input === "string"
        ? { id, kind: "text", text: input, duration }
        : { id, kind: "rich", title: input.title, description: input.description, duration };
    setToasts((prev) => [...prev, entry]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-16 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="rounded-lg bg-[#1a1a1a] border border-white/20 text-[#F5F5F5] px-4 py-2.5 text-sm shadow-lg pointer-events-auto"
          >
            {t.kind === "text" ? (
              t.text
            ) : (
              <div>
                <p className="font-medium text-[#F5F5F5]">{t.title}</p>
                {t.description ? (
                  <p className="text-[12px] text-[rgba(245,245,245,0.65)] mt-1 leading-snug">
                    {t.description}
                  </p>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): (input: ToastInput) => void {
  const ctx = useContext(ToastContext);
  return ctx ?? (() => {});
}

"use client";

import { createContext, useCallback, useContext, useState } from "react";

export type ToastTone = "default" | "success" | "destructive";

export type ToastInput =
  | string
  | { title: string; description?: string; duration?: number; tone?: ToastTone };

type ToastMessage =
  | { id: number; kind: "text"; text: string; duration: number; tone: ToastTone }
  | {
      id: number;
      kind: "rich";
      title: string;
      description?: string;
      duration: number;
      tone: ToastTone;
    };

const ToastContext = createContext<((input: ToastInput) => void) | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback((input: ToastInput) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const duration =
      typeof input === "string" ? 3000 : Math.max(2000, input.duration ?? 4000);
    const tone: ToastTone = typeof input === "string" ? "default" : (input.tone ?? "default");
    const entry: ToastMessage =
      typeof input === "string"
        ? { id, kind: "text", text: input, duration, tone }
        : { id, kind: "rich", title: input.title, description: input.description, duration, tone };
    setToasts((prev) => [...prev, entry]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-16 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm">
        {toasts.map((t) => {
          const toneClass =
            t.tone === "success"
              ? "border-[var(--color-success)]/35 bg-[var(--color-success-muted)]"
              : t.tone === "destructive"
                ? "border-[var(--color-error)]/35 bg-[var(--color-error-muted)]"
                : "border-border bg-accent";
          return (
            <div
              key={t.id}
              className={`pointer-events-auto rounded-lg border px-4 py-2.5 text-sm text-foreground shadow-lg ${toneClass}`}
              role="status"
            >
              {t.kind === "text" ? (
                t.text
              ) : (
                <div>
                  <p className="font-medium text-foreground">{t.title}</p>
                  {t.description ? (
                    <p className="mt-1 text-sm leading-snug text-muted-foreground">{t.description}</p>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): (input: ToastInput) => void {
  const ctx = useContext(ToastContext);
  return ctx ?? (() => {});
}

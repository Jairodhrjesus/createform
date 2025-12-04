"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import * as Toast from "@radix-ui/react-toast";
import { CheckIcon, ExclamationTriangleIcon, InfoCircledIcon } from "@radix-ui/react-icons";

type ToastVariant = "success" | "error" | "info";

type ToastMessage = {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastContextValue = {
  toast: (message: Omit<ToastMessage, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const icons: Record<ToastVariant, JSX.Element> = {
  success: <CheckIcon className="h-4 w-4 text-emerald-600" aria-hidden />,
  error: <ExclamationTriangleIcon className="h-4 w-4 text-red-600" aria-hidden />,
  info: <InfoCircledIcon className="h-4 w-4 text-slate-600" aria-hidden />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Array<ToastMessage & { open: boolean }>>([]);

  const toast = useCallback((message: Omit<ToastMessage, "id">) => {
    const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    setItems((prev) => [...prev, { ...message, id, open: true }]);
  }, []);

  const handleOpenChange = useCallback((id: string, open: boolean) => {
    if (open) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <Toast.Provider swipeDirection="right" duration={4000}>
      <ToastContext.Provider value={value}>{children}</ToastContext.Provider>

      {items.map(({ id, title, description, variant = "info", open }) => (
        <Toast.Root
          key={id}
          open={open}
          onOpenChange={(nextOpen) => handleOpenChange(id, nextOpen)}
          className={`pointer-events-auto mb-2 flex w-[320px] items-start gap-3 rounded-xl border bg-white p-3 shadow-lg ring-1 ring-slate-900/5 data-[state=open]:animate-slideIn data-[state=closed]:animate-fadeOut ${
            variant === "success"
              ? "border-emerald-100"
              : variant === "error"
              ? "border-red-100"
              : "border-slate-200"
          }`}
        >
          <div className="mt-0.5">{icons[variant]}</div>
          <div className="flex-1 space-y-0.5">
            <Toast.Title className="text-sm font-semibold text-slate-900">{title}</Toast.Title>
            {description && <Toast.Description className="text-xs text-slate-600">{description}</Toast.Description>}
          </div>
          <Toast.Close className="text-slate-400 transition hover:text-slate-600" aria-label="Cerrar">
            ×
          </Toast.Close>
        </Toast.Root>
      ))}

      <Toast.Viewport className="fixed bottom-4 right-4 z-[100] flex w-[360px] max-w-full flex-col outline-none" />
    </Toast.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

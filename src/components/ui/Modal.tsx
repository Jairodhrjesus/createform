"use client";

import { ReactNode, useEffect } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  footer?: ReactNode;
  children?: ReactNode;
  size?: "sm" | "md";
};

export default function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  children,
  size = "md",
}: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-black/30 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Cerrar modal"
      />
      <div
        className={`relative z-10 w-full rounded-2xl bg-white shadow-2xl border border-slate-200 ${size === "sm" ? "max-w-md" : "max-w-lg"}`}
      >
        <div className="px-6 pt-6 pb-4">
          {title && (
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          )}
          {description && (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          )}
          <div className="mt-4">{children}</div>
        </div>
        {footer && (
          <div className="flex justify-end gap-2 px-6 pb-5 pt-3 border-t border-slate-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";

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
  // Manejador para adaptar el cambio de estado de Radix a tu prop onClose
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        {/* 1. Overlay (Fondo oscuro) */}
        <Dialog.Overlay 
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" 
        />
        
        {/* 2. Contenido del Modal */}
        <Dialog.Content
          className={`fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border border-slate-200 bg-white shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-2xl ${
            size === "sm" ? "max-w-md" : "max-w-lg"
          }`}
        >
          <div className="flex flex-col gap-1 p-6">
            {title && (
              <div className="flex items-center justify-between">
                <Dialog.Title className="text-lg font-semibold text-slate-900">
                  {title}
                </Dialog.Title>
                {/* Botón de cierre superior (Opcional pero recomendado para UX) */}
                <Dialog.Close className="rounded-full p-1 opacity-70 transition-opacity hover:bg-slate-100 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-400">
                  <Cross2Icon className="h-4 w-4" />
                  <span className="sr-only">Cerrar</span>
                </Dialog.Close>
              </div>
            )}
            
            {description && (
              <Dialog.Description className="text-sm text-slate-500">
                {description}
              </Dialog.Description>
            )}

            <div className="mt-2">{children}</div>
          </div>

          {footer && (
            <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:rounded-b-2xl">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
"use client";

import { useEffect, useState } from "react";

type Props = {
  onSubmit: (payload: { name: string; email: string }) => void | Promise<void>;
  loading?: boolean;
  defaultName?: string;
  defaultEmail?: string;
  onBack?: () => void;
  errorMessage?: string | null;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  disclaimer?: string;
  collectName?: boolean;
  requireName?: boolean;
  collectEmail?: boolean;
  requireEmail?: boolean;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailGate({
  onSubmit,
  loading = false,
  defaultName = "",
  defaultEmail = "",
  onBack,
  errorMessage,
  title = "Ultimo paso: recibe tu resultado por email",
  subtitle = "Ingresa tu correo (requerido) y opcionalmente tu nombre para enviarte el resumen del resultado.",
  ctaLabel = "Ver resultado",
  disclaimer = "Guardamos tu resultado y te enviamos el enlace en tu correo.",
  collectName = true,
  requireName = false,
  collectEmail = true,
  requireEmail = true,
}: Props) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setName(defaultName);
  }, [defaultName]);

  useEffect(() => {
    setEmail(defaultEmail);
  }, [defaultEmail]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (collectEmail && (requireEmail || email.trim())) {
      if (!emailRegex.test(email.trim())) {
        setLocalError("Ingresa un email valido para ver tu resultado.");
        return;
      }
    }
    if (collectName && requireName && !name.trim()) {
      setLocalError("Ingresa tu nombre para continuar.");
      return;
    }
    setLocalError(null);
    await onSubmit({ name: name.trim(), email: email.trim() });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-6 shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Casi listo
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            {title}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {subtitle}
          </p>
        </div>
        <div className="hidden sm:block rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white shadow-sm" aria-hidden>
          •
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {collectName && (
            <div>
              <label className="text-sm font-semibold text-slate-800">
                {requireName ? "Nombre (requerido)" : "Nombre (opcional)"}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Ana Martinez"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
              />
            </div>
          )}
          {collectEmail && (
            <div>
              <label className="text-sm font-semibold text-slate-800">
                {requireEmail ? "Email (requerido)" : "Email (opcional)"}
              </label>
              <input
                type="email"
                required={requireEmail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@empresa.com"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
              />
            </div>
          )}
        </div>

        {(localError || errorMessage) && (
          <p className="text-sm font-semibold text-red-600">{localError || errorMessage}</p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Volver a preguntas
            </button>
          )}
          <div className="ml-auto flex items-center gap-3">
            {disclaimer && <p className="text-xs text-slate-500">{disclaimer}</p>}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? "Guardando lead..." : ctaLabel}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LeadCaptureField,
  LeadCaptureValueMap,
  buildNameFromValues,
  extractEmailFromValues,
  hasAnyValue,
} from "@/utils/leadCapture";

type Props = {
  fields: LeadCaptureField[];
  onSubmit: (payload: {
    values: LeadCaptureValueMap;
    primaryEmail?: string;
    fullName?: string;
  }) => void | Promise<void>;
  loading?: boolean;
  defaultValues?: LeadCaptureValueMap;
  onBack?: () => void;
  errorMessage?: string | null;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  disclaimer?: string;
  allowSkipValidation?: boolean;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailGate({
  fields,
  onSubmit,
  loading = false,
  defaultValues = {},
  onBack,
  errorMessage,
  title = "Ultimo paso: recibe tu resultado por email",
  subtitle = "Ingresa tus datos de contacto para recibir el resumen. Al menos un campo es requerido.",
  ctaLabel = "Ver resultado",
  disclaimer = "Guardamos tu resultado y usaremos estos datos solo para enviarte el enlace.",
  allowSkipValidation = false,
}: Props) {
  const [values, setValues] = useState<LeadCaptureValueMap>(defaultValues || {});
  const [localError, setLocalError] = useState<string | null>(null);

  const requiredFieldIds = useMemo(
    () => fields.filter((f) => f.required).map((f) => f.id),
    [fields]
  );

  useEffect(() => {
    setValues(defaultValues || {});
  }, [defaultValues]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!allowSkipValidation) {
      const missing = requiredFieldIds.filter((id) => !values[id]?.trim());
      if (missing.length > 0) {
        setLocalError("Completa los campos obligatorios para continuar.");
        return;
      }
      if (!hasAnyValue(values)) {
        setLocalError("Ingresa al menos un dato de contacto para continuar.");
        return;
      }
      const emailValue = extractEmailFromValues(fields, values);
      if (emailValue && !emailRegex.test(emailValue)) {
        setLocalError("Ingresa un email valido para ver tu resultado.");
        return;
      }
    }
    const emailValue = extractEmailFromValues(fields, values);

    setLocalError(null);
    await onSubmit({
      values: Object.fromEntries(
        Object.entries(values).map(([key, val]) => [key, (val || "").trim()])
      ),
      primaryEmail: emailValue || undefined,
      fullName: buildNameFromValues(fields, values) || undefined,
    });
  };

  const handleValueChange = (id: string, value: string) => {
    setLocalError(null);
    setValues((prev) => ({ ...prev, [id]: value }));
  };

  const renderInputType = (field: LeadCaptureField) => {
    if (field.type === "email") return "email";
    if (field.type === "phone") return "tel";
    return "text";
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
          {fields.map((field) => (
            <div key={field.id}>
              <label className="text-sm font-semibold text-slate-800">
                {field.label} {field.required ? "(requerido)" : "(opcional)"}
              </label>
              <input
                type={renderInputType(field)}
                required={false}
                value={values[field.id] || ""}
                onChange={(e) => handleValueChange(field.id, e.target.value)}
                placeholder={field.placeholder || ""}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
              />
            </div>
          ))}
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

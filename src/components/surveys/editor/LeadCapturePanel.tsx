"use client";

import { useEffect, useState, useCallback } from "react";
import type { Schema } from "@/amplify/data/resource";
import { client } from "@/utils/amplify-utils";
import { useLeadCaptureBlocks } from "@/hooks/useLeadCaptureBlocks";
import LeadCaptureFieldBuilder from "./LeadCaptureFieldBuilder";
import {
  defaultLeadFields,
  sanitizeLeadFields,
  createLeadField,
  LeadCaptureField,
  LEAD_FIELD_LIBRARY,
} from "@/utils/leadCapture";

interface LeadCapturePanelProps {
  survey: Schema["Survey"]["type"];
  surveyId: string;
  variant?: "panel" | "embedded";
}

export function LeadCapturePanel({ survey, surveyId, variant = "panel" }: LeadCapturePanelProps) {
  const [leadTitle, setLeadTitle] = useState("Ultimo paso: recibe tu resultado por email");
  const [leadSubtitle, setLeadSubtitle] = useState(
    "Ingresa tus datos de contacto (al menos uno) para enviarte el resumen del resultado."
  );
  const [leadCta, setLeadCta] = useState("Ver resultado");
  const [leadDisclaimer, setLeadDisclaimer] = useState(
    "Guardamos tu resultado y usaremos estos datos solo para enviarte el enlace."
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const {
    fields,
    addField,
    removeField,
    updateField,
    toggleRequired,
    moveField,
    resetFields,
  } = useLeadCaptureBlocks(defaultLeadFields());

  useEffect(() => {
    if (!survey) return;
    setLeadTitle(
      survey.leadCaptureTitle || "Ultimo paso: recibe tu resultado por email"
    );
    setLeadSubtitle(
      survey.leadCaptureSubtitle ||
        "Ingresa tus datos de contacto (al menos uno) para enviarte el resumen del resultado."
    );
    setLeadCta(survey.leadCaptureCtaLabel || "Ver resultado");
    setLeadDisclaimer(
      survey.leadCaptureDisclaimer ||
        "Guardamos tu resultado y usaremos estos datos solo para enviarte el enlace."
    );
    const legacyFields: LeadCaptureField[] = [];
    if (survey.leadCaptureCollectName ?? true) {
      legacyFields.push(
        createLeadField("first_name", { required: survey.leadCaptureRequireName ?? false })
      );
    }
    if (survey.leadCaptureCollectEmail ?? true) {
      legacyFields.push(
        createLeadField("email", { required: survey.leadCaptureRequireEmail ?? true })
      );
    }
    const incoming = (survey as any).leadCaptureFields || legacyFields;
    resetFields(sanitizeLeadFields(incoming));
  }, [resetFields, survey]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setMessage(null);
    const normalizedFields = fields.map((field) => {
      const template = LEAD_FIELD_LIBRARY.find((tpl) => tpl.type === field.type);
      return {
        ...field,
        label: field.label?.trim() || template?.label || "Campo",
        placeholder: field.placeholder ?? template?.placeholder ?? "",
        required: Boolean(field.required),
      };
    });
    try {
      const { errors } = await client.models.Survey.update({
        id: surveyId,
        leadCaptureTitle: leadTitle,
        leadCaptureSubtitle: leadSubtitle,
        leadCaptureCtaLabel: leadCta,
        leadCaptureDisclaimer: leadDisclaimer,
        leadCaptureFields: normalizedFields,
        // Legacy flags kept in sync for backward compatibility
        leadCaptureCollectName: normalizedFields.some((f) => f.type === "first_name"),
        leadCaptureRequireName: normalizedFields.some((f) => f.type === "first_name" && f.required),
        leadCaptureCollectEmail: normalizedFields.some((f) => f.type === "email"),
        leadCaptureRequireEmail: normalizedFields.some((f) => f.type === "email" && f.required),
      } as unknown as Schema["Survey"]["updateType"]);

      if (errors?.length) {
        const messages = errors.map((e) => e.message || "").join("; ");
        if (messages.includes("not defined for input object type") || messages.includes("Unknown field")) {
          setMessage(
            "Actualiza el backend para los campos dinamicos de lead capture (leadCaptureFields/leadCaptureData)."
          );
        } else {
          setMessage("No se pudo guardar la configuracion. Detalle: " + messages);
        }
        return;
      }

      setMessage("Configuracion de lead capture guardada para este formulario.");
    } catch (err) {
      console.error("No se pudo guardar lead capture:", err);
      setMessage("Error de red al guardar la configuracion. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }, [fields, leadCta, leadDisclaimer, leadSubtitle, leadTitle, surveyId]);

  return (
    <div
      className={
        variant === "embedded"
          ? "rounded-3xl border border-amber-200 bg-white p-6 shadow-sm"
          : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      }
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Lead capture
          </p>
          <h3 className="text-lg font-semibold text-slate-900">
            Personaliza el lead capture
          </h3>
          <p className="text-sm text-slate-600">
            Define el copy y arma bloques con los datos que solicitas antes de mostrar el resultado.
          </p>
          <p className="text-xs text-slate-500">
            Esta configuracion se guarda solo en esta encuesta.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <label className="text-sm font-semibold text-slate-800">Titulo</label>
          <input
            value={leadTitle}
            onChange={(e) => setLeadTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-800">Subtitulo</label>
          <textarea
            value={leadSubtitle}
            onChange={(e) => setLeadSubtitle(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-slate-800">CTA</label>
            <input
              value={leadCta}
              onChange={(e) => setLeadCta(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-800">Disclaimer</label>
            <input
              value={leadDisclaimer}
              onChange={(e) => setLeadDisclaimer(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
        </div>

        <LeadCaptureFieldBuilder
          fields={fields}
          onAdd={addField}
          onRemove={removeField}
          onChange={updateField}
          onToggleRequired={toggleRequired}
          onMove={moveField}
        />

        {message && <p className="text-xs font-semibold text-emerald-700">{message}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              setLeadTitle("Ultimo paso: recibe tu resultado por email");
              setLeadSubtitle(
                "Ingresa tus datos de contacto (al menos uno) para enviarte el resumen del resultado."
              );
              setLeadCta("Ver resultado");
              setLeadDisclaimer(
                "Guardamos tu resultado y usaremos estos datos solo para enviarte el enlace."
              );
              resetFields(defaultLeadFields());
              setMessage(null);
            }}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Restaurar copy
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar configuracion"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LeadCapturePanel;

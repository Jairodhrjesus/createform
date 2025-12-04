"use client";

import { useEffect, useState, useCallback } from "react";
import type { Schema } from "@/amplify/data/resource";
import { client } from "@/utils/amplify-utils";

interface LeadCapturePanelProps {
  survey: Schema["Survey"]["type"];
  surveyId: string;
  variant?: "panel" | "embedded";
}

export function LeadCapturePanel({ survey, surveyId, variant = "panel" }: LeadCapturePanelProps) {
  const [leadTitle, setLeadTitle] = useState("Ultimo paso: recibe tu resultado por email");
  const [leadSubtitle, setLeadSubtitle] = useState(
    "Ingresa tu correo y (opcional) tu nombre para enviarte el resumen del resultado."
  );
  const [leadCta, setLeadCta] = useState("Ver resultado");
  const [leadDisclaimer, setLeadDisclaimer] = useState(
    "Guardamos tu resultado y te enviamos el enlace en tu correo."
  );
  const [collectName, setCollectName] = useState(true);
  const [requireName, setRequireName] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!survey) return;
    setLeadTitle(
      survey.leadCaptureTitle || "Ultimo paso: recibe tu resultado por email"
    );
    setLeadSubtitle(
      survey.leadCaptureSubtitle ||
        "Ingresa tu correo y (opcional) tu nombre para enviarte el resumen del resultado."
    );
    setLeadCta(survey.leadCaptureCtaLabel || "Ver resultado");
    setLeadDisclaimer(
      survey.leadCaptureDisclaimer || "Guardamos tu resultado y te enviamos el enlace en tu correo."
    );
    setCollectName(survey.leadCaptureCollectName ?? true);
    setRequireName(survey.leadCaptureRequireName ?? false);
  }, [survey]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setMessage(null);
    try {
      const { errors } = await client.models.Survey.update({
        id: surveyId,
        leadCaptureTitle: leadTitle,
        leadCaptureSubtitle: leadSubtitle,
        leadCaptureCtaLabel: leadCta,
        leadCaptureDisclaimer: leadDisclaimer,
        leadCaptureCollectName: collectName,
        leadCaptureRequireName: requireName,
        leadCaptureCollectEmail: true,
        leadCaptureRequireEmail: true,
      } as unknown as Schema["Survey"]["updateType"]);

      if (errors?.length) {
        const messages = errors.map((e) => e.message || "").join("; ");
        if (messages.includes("not defined for input object type") || messages.includes("Unknown field")) {
          setMessage(
            "Actualiza el backend para los campos de lead capture (npx ampx sandbox o amplify push && amplify codegen)."
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
  }, [
    collectName,
    leadCta,
    leadDisclaimer,
    leadSubtitle,
    leadTitle,
    requireName,
    surveyId,
  ]);

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
            Personaliza la puerta de email
          </h3>
          <p className="text-sm text-slate-600">
            Define el copy y los campos que solicitas antes de mostrar el resultado.
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

        <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm text-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Campos a solicitar</p>
              <p className="text-xs text-slate-500">
                Email es obligatorio; puedes decidir si pides nombre y si es requerido.
              </p>
            </div>
            <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">
              Email siempre requerido
            </span>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-800">
              <input
                type="checkbox"
                checked={collectName}
                onChange={(e) => setCollectName(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
              />
              Solicitar nombre
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-800 pl-6">
              <input
                type="checkbox"
                checked={requireName}
                onChange={(e) => setRequireName(e.target.checked)}
                disabled={!collectName}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400 disabled:opacity-50"
              />
              Hacer nombre obligatorio
            </label>
          </div>
        </div>

        {message && <p className="text-xs font-semibold text-emerald-700">{message}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              setLeadTitle("Ultimo paso: recibe tu resultado por email");
              setLeadSubtitle(
                "Ingresa tu correo y (opcional) tu nombre para enviarte el resumen del resultado."
              );
              setLeadCta("Ver resultado");
              setLeadDisclaimer(
                "Guardamos tu resultado y te enviamos el enlace en tu correo."
              );
              setCollectName(true);
              setRequireName(false);
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

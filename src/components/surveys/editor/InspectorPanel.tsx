"use client";

import type { Schema } from "@/amplify/data/resource";
import { DropdownSelect } from "@/components/ui/DropdownSelect";

type QuestionType = Schema["Question"]["type"];

const QUESTION_TYPES: { value: string; label: string }[] = [
  { value: "short_text", label: "Respuesta corta" },
  { value: "paragraph", label: "Párrafo" },
  { value: "single_choice", label: "Opción múltiple" },
  { value: "checkboxes", label: "Casillas de verificación" },
  { value: "dropdown", label: "Lista desplegable" },
  { value: "file_upload", label: "Carga de archivos" },
  { value: "linear_scale", label: "Escala lineal" },
  { value: "rating", label: "Calificación" },
  { value: "multi_grid", label: "Cuadrícula de opción múltiple" },
  { value: "checkbox_grid", label: "Cuadrícula de casillas" },
  { value: "date", label: "Fecha" },
  { value: "time", label: "Hora" },
];

interface InspectorPanelProps {
  question: QuestionType | null;
  onChangeType?: (type: string) => void;
  required?: boolean;
  onToggleRequired?: () => void;
  disabled?: boolean;
  disabledMessage?: string;
}

export function InspectorPanel({
  question,
  onChangeType,
  required = false,
  onToggleRequired,
  disabled = false,
  disabledMessage,
}: InspectorPanelProps) {
  const isInactive = disabled || !question;
  const message = disabledMessage || "Inspector no disponible en este modo.";
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Question</p>
        {isInactive ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
            {message}
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Tipo de pregunta
            </label>
            <DropdownSelect
              value={question?.type || "short_text"}
              onChange={(val) => onChangeType?.(val)}
              options={QUESTION_TYPES.map((t) => ({ value: t.value, label: t.label }))}
              disabled={isInactive}
              className="w-full justify-between"
              menuWidthClass="w-full"
            />
            <label className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <div className="flex flex-col">
                <span>Obligatoria</span>
                <span className="text-xs text-slate-500">Controla si el usuario debe responder.</span>
              </div>
              <input
                type="checkbox"
                checked={required}
                onChange={onToggleRequired}
                disabled={isInactive}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400 disabled:opacity-50"
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

export default InspectorPanel;

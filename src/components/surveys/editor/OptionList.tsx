"use client";

import { useEffect, useMemo, useState } from "react";
import type { Schema } from "@/amplify/data/resource";

type OptionType = Schema["Option"]["type"];
type ControlKind = "radio" | "checkbox" | "dropdown" | "linear" | "rating";

interface OptionListProps {
  options: OptionType[];
  loading?: boolean;
  onAdd: (text: string, score?: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdate?: (id: string, updates: Partial<OptionType>, persist?: boolean) => Promise<void>;
  onReorder?: (ids: string[]) => void;
  questionType?: string;
}

const SCORE_HINT: Record<string, string> = {
  short_text: "Tipo informativo: no suma puntaje automatico.",
  paragraph: "Tipo informativo: no suma puntaje automatico.",
  single_choice: "Se toma el puntaje de la opcion seleccionada (radio).",
  dropdown: "Se toma el puntaje de la opcion seleccionada en el menu desplegable.",
  checkboxes: "Se suman los puntajes de todas las casillas seleccionadas.",
  multi_grid: "Puntaje por fila/columna (definir logica luego).",
  checkbox_grid: "Suma de casillas marcadas en la cuadricula.",
  file_upload: "Define la calificacion segun validaciones del archivo.",
  linear_scale: "Escala 1-10: asigna puntaje por nivel (default 1 c/u).",
  rating: "Calificacion por estrellas: mapea cada estrella a puntaje (default 1 c/u).",
  date: "Asigna puntaje segun fecha elegida (p. ej. rango).",
  time: "Asigna puntaje segun hora elegida.",
};

const NO_OPTION_TYPES = new Set(["short_text", "paragraph", "file_upload", "date", "time"]);

export function supportsOptions(questionType?: string) {
  if (!questionType) return true;
  return !NO_OPTION_TYPES.has(questionType);
}

const CONTROL_TYPE: Record<string, ControlKind> = {
  single_choice: "radio",
  dropdown: "dropdown",
  checkboxes: "checkbox",
  multi_grid: "checkbox",
  checkbox_grid: "checkbox",
  linear_scale: "linear",
  rating: "rating",
};

const DEFAULT_SCORE: Record<string, string> = {
  linear_scale: "1",
  rating: "1",
};

const PLACEHOLDER_TEXT: Record<string, string> = {
  linear_scale: 'Valor de escala (ej: "1", "2", ...)',
  rating: 'Estrella (ej: "1", "2", ...)',
};

function renderControl(kind: ControlKind) {
  if (kind === "checkbox") {
    return <input type="checkbox" disabled className="h-4 w-4" />;
  }
  if (kind === "dropdown") {
    return (
      <span className="flex h-4 w-4 items-center justify-center rounded border border-slate-300 bg-slate-100 text-[9px] font-semibold text-slate-600">
        v
      </span>
    );
  }
  if (kind === "linear") {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-600">
        #
      </span>
    );
  }
  if (kind === "rating") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4 text-amber-500"
        aria-hidden
        fill="currentColor"
      >
        <path d="M12 3.6 9.8 9H4.9l4.4 3.2-1.7 5.1L12 14.7l4.4 2.6-1.7-5.1 4.4-3.2h-4.9Z" />
      </svg>
    );
  }
  return <input type="radio" disabled className="h-4 w-4" />;
}

export function OptionList({
  options,
  loading,
  onAdd,
  onDelete,
  onUpdate,
  onReorder,
  questionType,
}: OptionListProps) {
  const [newText, setNewText] = useState("");
  const [newScore, setNewScore] = useState(DEFAULT_SCORE[questionType || ""] || "0");
  const [saving, setSaving] = useState(false);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [localTexts, setLocalTexts] = useState<Record<string, string>>({});
  const [localScores, setLocalScores] = useState<Record<string, number>>({});

  const hasOptions = useMemo(() => supportsOptions(questionType), [questionType]);

  useEffect(() => {
    setNewText("");
    setNewScore(DEFAULT_SCORE[questionType || ""] || "0");
  }, [questionType]);

  // Sync local inputs when options change (e.g., external updates)
  useEffect(() => {
    setLocalTexts(
      Object.fromEntries(options.map((opt) => [opt.id as string, opt.text || ""]))
    );
    setLocalScores(
      Object.fromEntries(options.map((opt) => [opt.id as string, opt.score ?? 0]))
    );
  }, [options]);

  if (!hasOptions) return null;

  const control = CONTROL_TYPE[questionType || ""] || "radio";

  const hint =
    SCORE_HINT[questionType || "single_choice"] || "Configura el puntaje para cada opcion.";

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    setSaving(true);
    await onAdd(newText, parseInt(newScore || "0", 10) || 0);
    setNewText("");
    setNewScore(DEFAULT_SCORE[questionType || ""] || "0");
    setSaving(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Sistema de puntaje
          </p>
          <p className="text-xs text-slate-500">{hint}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
          {options.length} items
        </span>
      </div>

      {hasOptions ? (
        <form
          onSubmit={handleAdd}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 shadow-inner"
        >
          <div className="grid gap-2 sm:grid-cols-[1fr,120px,auto]">
            <input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder={
                PLACEHOLDER_TEXT[questionType || ""] || 'Nueva opcion (ej: "Opcion A")'
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
            />
            <input
              value={newScore}
              onChange={(e) => setNewScore(e.target.value)}
              type="number"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
              aria-label="Puntaje"
            />
            <button
              type="submit"
              disabled={!newText.trim() || saving}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Agregar"}
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
          Tipo informativo: no usa opciones ni puntaje automatico.
        </div>
      )}

      {hasOptions ? (
        <div className="space-y-2">
          {loading && <p className="text-xs text-slate-500">Cargando opciones...</p>}
          {!loading && options.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
              Aun no hay opciones para esta pregunta.
            </div>
          )}
          {options.map((opt, idx) => (
            <div
              key={opt.id}
              className={[
                "flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm sm:flex-row sm:items-center sm:justify-between",
                "transition-transform duration-150 ease-out",
                dragOverId === opt.id ? "border-blue-200 bg-blue-50/40 translate-y-0.5" : "",
                draggingId === opt.id ? "opacity-80 scale-[0.99]" : "",
              ].join(" ")}
              draggable={Boolean(onReorder)}
              onDragStart={(e) => {
                if (!onReorder) return;
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", opt.id as string);
                setDraggingId(opt.id as string);
              }}
              onDragOver={(e) => {
                if (!onReorder) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setDragOverId(opt.id as string);
              }}
              onDragLeave={() => setDragOverId(null)}
              onDrop={(e) => {
                if (!onReorder) return;
                e.preventDefault();
                const draggedId = e.dataTransfer.getData("text/plain");
                if (!draggedId || draggedId === opt.id) return;
                const currentOrder = options.map((o) => o.id as string);
                const from = currentOrder.indexOf(draggedId);
                const to = currentOrder.indexOf(opt.id as string);
                if (from === -1 || to === -1 || from === to) {
                  setDragOverId(null);
                  setDraggingId(null);
                  return;
                }
                const nextOrder = [...currentOrder];
                const [moved] = nextOrder.splice(from, 1);
                nextOrder.splice(to, 0, moved);
                onReorder?.(nextOrder);
                setDragOverId(null);
                setDraggingId(null);
              }}
              onDragEnd={() => {
                setDragOverId(null);
                setDraggingId(null);
              }}
            >
              <div className="flex items-center gap-3">
                {renderControl(control)}
                <div className="flex flex-col">
                  <input
                    value={localTexts[opt.id as string] ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setLocalTexts((prev) => ({ ...prev, [opt.id as string]: value }));
                      onUpdate?.(opt.id as string, { text: value }, false);
                    }}
                    onBlur={(e) => {
                      const value = e.target.value;
                      onUpdate?.(opt.id as string, { text: value }, true);
                    }}
                    className="w-full min-w-[180px] rounded-lg border border-slate-200 px-2 py-1 text-sm font-semibold text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-200"
                    placeholder='Texto de opcion (ej: "Opcion A")'
                  />
                  <span className="text-xs text-slate-500">{localScores[opt.id as string] ?? 0} pts</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-xs text-slate-500">
                  <span>Puntaje</span>
                  <input
                    type="number"
                    className="w-16 rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-200"
                    value={localScores[opt.id as string] ?? 0}
                    onChange={(e) => {
                      const nextScore = parseInt(e.target.value || "0", 10) || 0;
                      setLocalScores((prev) => ({ ...prev, [opt.id as string]: nextScore }));
                      onUpdate?.(opt.id as string, { score: nextScore }, false);
                    }}
                    onBlur={(e) => {
                      const nextScore = parseInt(e.target.value || "0", 10) || 0;
                      onUpdate?.(opt.id as string, { score: nextScore }, true);
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => onDelete(opt.id as string)}
                  className="text-xs font-semibold text-red-600 hover:text-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default OptionList;

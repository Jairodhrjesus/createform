"use client";

import type { Schema } from "@/amplify/data/resource";

type OptionType = Schema["Option"]["type"];

interface GridPreviewProps {
  options?: OptionType[];
  control?: "radio" | "checkbox";
  rows?: string[];
}

const DEFAULT_ROWS = ["Fila 1", "Fila 2"];

export default function GridPreview({
  options = [],
  control = "checkbox",
  rows = DEFAULT_ROWS,
}: GridPreviewProps) {
  const cols =
    options.length > 0
      ? options
          .slice()
          .sort((a, b) => (a.text || "").localeCompare(b.text || ""))
          .map((o, idx) => o.text || `Columna ${idx + 1}`)
      : ["Columna 1", "Columna 2"];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">Cuadricula</p>
          <p className="text-xs text-slate-500">
            Filas y columnas con {control === "checkbox" ? "casillas" : "seleccion unica"}.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
          {rows.length} filas / {cols.length} cols
        </span>
      </div>

      <div className="overflow-auto rounded-2xl border border-slate-200 bg-white shadow-inner">
        <div className="min-w-[320px]">
          <div className="grid grid-cols-[160px_repeat(auto-fill,minmax(120px,1fr))] border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <span>Filas</span>
            {cols.map((col, idx) => (
              <span key={`${col}-${idx}`} className="text-center">
                {col}
              </span>
            ))}
          </div>

          <div className="divide-y divide-slate-200">
            {rows.map((row, rowIdx) => (
              <div
                key={`${row}-${rowIdx}`}
                className="grid grid-cols-[160px_repeat(auto-fill,minmax(120px,1fr))] items-center px-3 py-2 text-sm text-slate-700"
              >
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <span className="text-xs text-slate-400">{rowIdx + 1}.</span>
                  <span>{row}</span>
                </div>
                {cols.map((col, colIdx) => (
                  <label
                    key={`${row}-${col}-${colIdx}`}
                    className="flex items-center justify-center gap-2 text-xs text-slate-500"
                  >
                    <input
                      type={control === "checkbox" ? "checkbox" : "radio"}
                      disabled
                      className="h-4 w-4 text-blue-600"
                      name={`grid-row-${rowIdx}`}
                    />
                  </label>
                ))}
              </div>
            ))}
            <div className="grid grid-cols-[160px_repeat(auto-fill,minmax(120px,1fr))] items-center px-3 py-2 text-sm text-slate-400">
              <span className="italic">Agregar fila</span>
              {cols.map((_, idx) => (
                <span key={`add-col-${idx}`} className="flex items-center justify-center text-xs">
                  -
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
        <span className="rounded-full bg-slate-100 px-2 py-1">
          Vista previa de filas/columnas (configurar persistencia mas adelante).
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-1">Solo lectura.</span>
      </div>
    </div>
  );
}

"use client";

import type { Schema } from "@/amplify/data/resource";

type OptionType = Schema["Option"]["type"];

interface LinearScalePreviewProps {
  steps?: number;
  options?: OptionType[];
  defaultScore?: number;
}

export function LinearScalePreview({
  steps = 10,
  options = [],
  defaultScore = 1,
}: LinearScalePreviewProps) {
  const scale = (options.length
    ? [...options].sort((a, b) => {
        const numA = Number(a.text);
        const numB = Number(b.text);
        if (!Number.isNaN(numA) && !Number.isNaN(numB)) return numA - numB;
        return (a.text || "").localeCompare(b.text || "");
      })
    : Array.from({ length: steps }, (_, idx) => ({
        id: `scale-${idx + 1}`,
        text: String(idx + 1),
        score: defaultScore,
      }))) as Array<Pick<OptionType, "id" | "text" | "score">>;

  const scores = scale.map((s) => s.score ?? defaultScore ?? 0);
  const allEqual = scores.every((v) => v === scores[0]);
  const scoreLabel = allEqual
    ? `${scores[0] ?? 0} pt${(scores[0] ?? 0) === 1 ? "" : "s"} c/u`
    : "Puntaje por escala definido abajo";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-slate-700">Escala lineal 1-10</label>
        <span className="text-xs font-semibold text-slate-500">{scoreLabel}</span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {scale.map((opt) => (
          <div key={opt.id || opt.text} className="flex flex-col items-center gap-1">
            <button
              type="button"
              disabled
              className="h-9 w-9 rounded-full border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700"
            >
              {opt.text}
            </button>
            <span className="text-[11px] font-medium text-slate-500">
              {(opt.score ?? defaultScore ?? 0) || 0} pts
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LinearScalePreview;

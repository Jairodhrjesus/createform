"use client";

import type { Schema } from "@/amplify/data/resource";

type OptionType = Schema["Option"]["type"];

interface RatingPreviewProps {
  max?: number;
  options?: OptionType[];
  defaultScore?: number;
}

const StarIcon = ({ filled }: { filled?: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    className={`h-6 w-6 ${filled ? "text-amber-500" : "text-slate-300"}`}
    aria-hidden
    fill="currentColor"
  >
    <path d="M12 3.6 9.8 9H4.9l4.4 3.2-1.7 5.1L12 14.7l4.4 2.6-1.7-5.1 4.4-3.2h-4.9Z" />
  </svg>
);

export function RatingPreview({
  max = 5,
  options = [],
  defaultScore = 1,
}: RatingPreviewProps) {
  const stars = (options.length
    ? [...options].sort((a, b) => {
        const numA = Number(a.text);
        const numB = Number(b.text);
        if (!Number.isNaN(numA) && !Number.isNaN(numB)) return numA - numB;
        return (a.text || "").localeCompare(b.text || "");
      })
    : Array.from({ length: max }, (_, idx) => ({
        id: `star-${idx + 1}`,
        text: String(idx + 1),
        score: defaultScore,
      }))) as Array<Pick<OptionType, "id" | "text" | "score">>;

  const scores = stars.map((s) => s.score ?? defaultScore ?? 0);
  const allEqual = scores.every((v) => v === scores[0]);
  const scoreLabel = allEqual
    ? `${scores[0] ?? 0} pt${(scores[0] ?? 0) === 1 ? "" : "s"} por estrella`
    : "Puntaje configurado por estrella";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-slate-700">Calificacion (estrellas)</label>
        <span className="text-xs font-semibold text-slate-500">{scoreLabel}</span>
      </div>
      <div className="flex items-center gap-1">
        {stars.map((star) => (
          <div key={star.id || star.text} className="flex flex-col items-center gap-1">
            <StarIcon filled />
            <span className="text-[11px] font-medium text-slate-500">
              {(star.score ?? defaultScore ?? 0) || 0} pts
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RatingPreview;

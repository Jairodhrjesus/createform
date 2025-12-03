"use client";

import type { Schema } from "@/amplify/data/resource";

type OptionType = Schema["Option"]["type"];

interface CheckboxPreviewProps {
  options: OptionType[];
}

export function CheckboxPreview({ options }: CheckboxPreviewProps) {
  return (
    <div className="space-y-2">
      {options.length ? (
        options.map((opt) => (
          <label
            key={opt.id}
            className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-slate-700"
          >
            <input type="checkbox" disabled className="h-4 w-4" />
            <span>{opt.text}</span>
            <span className="text-xs text-slate-400">{opt.score ?? 0} pts</span>
          </label>
        ))
      ) : (
        <p className="text-sm text-slate-500">Agrega opciones para esta pregunta.</p>
      )}
    </div>
  );
}

export default CheckboxPreview;

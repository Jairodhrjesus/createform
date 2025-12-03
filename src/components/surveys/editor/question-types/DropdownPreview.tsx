"use client";

import type { Schema } from "@/amplify/data/resource";

type OptionType = Schema["Option"]["type"];

interface DropdownPreviewProps {
  options: OptionType[];
}

export function DropdownPreview({ options }: DropdownPreviewProps) {
  return (
    <div className="space-y-2">
      <select
        disabled
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-700"
        defaultValue=""
      >
        <option value="" disabled>
          Selecciona...
        </option>
        {options.map((opt, idx) => (
          <option key={`${opt.id}-${idx}`}>{opt.text}</option>
        ))}
      </select>
      {!options.length && (
        <p className="text-sm text-slate-500">Agrega opciones para esta pregunta.</p>
      )}
    </div>
  );
}

export default DropdownPreview;

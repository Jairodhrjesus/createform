"use client";

import type { Schema } from "@/amplify/data/resource";
import { DropdownSelect } from "@/components/ui/DropdownSelect";

type OptionType = Schema["Option"]["type"];

interface DropdownPreviewProps {
  options: OptionType[];
}

export function DropdownPreview({ options }: DropdownPreviewProps) {
  return (
    <div className="space-y-2">
      <DropdownSelect
        value=""
        onChange={() => {}}
        placeholder="Selecciona..."
        disabled
        options={options.map((opt, idx) => ({
          value: String(opt.id || idx),
          label: opt.text || "",
        }))}
        className="w-full justify-between"
        menuWidthClass="w-full"
      />
      {!options.length && (
        <p className="text-sm text-slate-500">Agrega opciones para esta pregunta.</p>
      )}
    </div>
  );
}

export default DropdownPreview;

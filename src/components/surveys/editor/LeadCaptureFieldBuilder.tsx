"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import {
  LeadCaptureField,
  LeadCaptureFieldType,
  LEAD_FIELD_LIBRARY,
} from "@/utils/leadCapture";

interface LeadCaptureFieldBuilderProps {
  fields: LeadCaptureField[];
  onAdd: (type: LeadCaptureFieldType) => void;
  onRemove: (id: string) => void;
  onChange: (id: string, updates: Partial<LeadCaptureField>) => void;
  onToggleRequired: (id: string) => void;
  onMove?: (id: string, direction: "up" | "down") => void;
}

const typeCopy: Record<LeadCaptureFieldType, string> = {
  first_name: "First name",
  last_name: "Last name",
  phone: "Phone number",
  email: "Email",
  company: "Company",
};

function FieldPreview({ field }: { field: LeadCaptureField }) {
  return (
    <input
      disabled
      value=""
      placeholder={field.placeholder || ""}
      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner"
    />
  );
}

export function LeadCaptureFieldBuilder({
  fields,
  onAdd,
  onRemove,
  onChange,
  onToggleRequired,
  onMove,
}: LeadCaptureFieldBuilderProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Campos de lead
          </p>
          <p className="text-xs text-slate-500">
            Construye bloques y define cuales datos pides. El usuario debera ingresar al menos uno.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {LEAD_FIELD_LIBRARY.map((tpl) => (
            <button
              key={tpl.type}
              type="button"
              onClick={() => onAdd(tpl.type)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              + {tpl.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {fields.map((field, index) => {
          const template = LEAD_FIELD_LIBRARY.find((tpl) => tpl.type === field.type);
          return (
            <div
              key={field.id}
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {field.label || typeCopy[field.type]}
                  </p>
                  <p className="text-xs text-slate-500">
                    {template?.description || "Campo personalizado"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-xs font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={() => onToggleRequired(field.id)}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                    />
                    Obligatorio
                  </label>
                  <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600">
                    <span className="rounded-full bg-slate-200 px-1">{index + 1}</span>
                    {typeCopy[field.type]}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onMove?.(field.id, "up")}
                      className="rounded-full border border-slate-200 p-1 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                      disabled={index === 0}
                    >
                      <ArrowUpIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onMove?.(field.id, "down")}
                      className="rounded-full border border-slate-200 p-1 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                      disabled={index === fields.length - 1}
                    >
                      <ArrowDownIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(field.id)}
                    disabled={fields.length <= 1}
                    className="rounded-full border border-slate-200 p-1 text-red-600 hover:bg-red-50 disabled:opacity-40"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Etiqueta</label>
                  <input
                    value={field.label}
                    onChange={(e) => onChange(field.id, { label: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
                    placeholder={typeCopy[field.type]}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Placeholder</label>
                  <input
                    value={field.placeholder || ""}
                    onChange={(e) => onChange(field.id, { placeholder: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
                    placeholder={template?.placeholder || ""}
                  />
                </div>
                <FieldPreview field={field} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LeadCaptureFieldBuilder;

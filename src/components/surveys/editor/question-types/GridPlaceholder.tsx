"use client";

export function GridPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700">{title}</label>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        {description}
      </div>
    </div>
  );
}

export default GridPlaceholder;

"use client";

interface ContentToolbarProps {
  onAddQuestion: () => void;
}

export function ContentToolbar({ onAddQuestion }: ContentToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <button
        onClick={onAddQuestion}
        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        type="button"
      >
        + Add content
      </button>
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span className="rounded-full border border-slate-200 px-3 py-1">Design</span>
        <span className="rounded-full border border-slate-200 px-3 py-1">Preview</span>
        <span className="rounded-full border border-slate-200 px-3 py-1">Share</span>
      </div>
    </div>
  );
}

export default ContentToolbar;

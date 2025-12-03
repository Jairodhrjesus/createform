"use client";

import type { Schema } from "@/amplify/data/resource";

type QuestionType = Schema["Question"]["type"];

interface QuestionRailProps {
  questions: QuestionType[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete?: (id: string) => void;
  onReorder?: (id: string, targetIndex: number) => void;
}

export function QuestionRail({
  questions,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
  onReorder,
}: QuestionRailProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Blocks
          </p>
          <button
            onClick={onAdd}
            className="h-8 w-8 rounded-full bg-slate-900 text-white shadow-sm hover:bg-slate-800"
            aria-label="Add question"
            type="button"
          >
            +
          </button>
        </div>
        <div className="space-y-2 border-t border-slate-100 p-3">
        {questions.map((q, index) => {
          const isActive = q.id === selectedId;
          return (
            <div
              key={`${q.id}-${index}`}
              className={[
                "group flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition",
                isActive
                  ? "border-slate-300 bg-slate-50 shadow-sm"
                  : "border-transparent hover:border-slate-100 hover:bg-slate-50",
              ].join(" ")}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(q.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onSelect(q.id);
              }}
              draggable={Boolean(onReorder)}
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", q.id as string);
              }}
              onDragOver={(e) => {
                if (!onReorder) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={(e) => {
                if (!onReorder) return;
                e.preventDefault();
                const draggedId = e.dataTransfer.getData("text/plain");
                if (!draggedId || draggedId === q.id) return;
                onReorder(draggedId, index);
              }}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-xs font-semibold text-slate-700">
                {index + 1}
              </span>
              <span className="flex-1 line-clamp-2 text-slate-700">
                {q.text || "Untitled"}
              </span>
              {onDelete ? (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(q.id);
                  }}
                  className="hidden h-7 w-7 items-center justify-center rounded-full border border-red-100 bg-red-50 text-[11px] font-semibold text-red-700 transition hover:bg-red-100 group-hover:flex"
                  title="Eliminar bloque"
                >
                  ×
                </span>
              ) : null}
            </div>
          );
        })}
          {!questions.length && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-xs text-slate-500">
              No questions yet. Add your first block.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Endings
          </p>
          <button
            type="button"
            className="h-7 w-7 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
            aria-label="Add ending"
          >
            +
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Configure the final screens later. This is a placeholder for endings.
        </p>
      </div>
    </div>
  );
}

export default QuestionRail;

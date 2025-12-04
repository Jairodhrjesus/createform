"use client";

import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  CopyIcon,
  TrashIcon,
  DotsHorizontalIcon,
  DragHandleDots2Icon,
} from "@radix-ui/react-icons";
import type { Schema } from "@/amplify/data/resource";

type QuestionType = Schema["Question"]["type"];

type EndingType = "final_screen" | "redirect_url" | "lead_capture";

type EndingItem = {
  id: string;
  title: string;
  description?: string;
  type: EndingType;
  urlLabel?: string;
  url?: string;
  minScore?: number | null;
  maxScore?: number | null;
};

interface QuestionRailProps {
  questions: QuestionType[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onReorder?: (id: string, targetIndex: number) => void;
  endings?: EndingItem[];
  selectedEndingId?: string | null;
  onSelectEnding?: (id: string) => void;
  onAddEnding?: (type: EndingType) => void;
  onDeleteEnding?: (id: string) => void;
  onReorderEnding?: (ids: string[]) => void;
  onDuplicateEnding?: (id: string) => void;
}

export function QuestionRail({
  questions,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
  onDuplicate,
  onReorder,
  endings = [],
  selectedEndingId = null,
  onSelectEnding,
  onAddEnding,
  onDeleteEnding,
  onReorderEnding,
  onDuplicateEnding,
}: QuestionRailProps) {
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverEndingId, setDragOverEndingId] = useState<string | null>(null);
  const [draggingEndingId, setDraggingEndingId] = useState<string | null>(null);
  const [localEndings, setLocalEndings] = useState<EndingItem[]>([]);

  const endingTemplates: { type: EndingType; label: string; description: string }[] = [
    { type: "final_screen", label: "End Screen", description: "Pantalla final con CTA/media" },
    { type: "redirect_url", label: "Redirect to URL", description: "Llevar a una URL o destino" },
  ];

  const displayEndings: EndingItem[] = endings.length ? endings : localEndings;

  const handleAddEnding = (type: EndingType) => {
    if (onAddEnding) {
      onAddEnding(type);
      return;
    }
    const next: EndingItem = {
      id: `local-ending-${Date.now()}`,
      title: type === "redirect_url" ? "Redirect to URL" : "End Screen",
      description:
        type === "redirect_url"
          ? "Redirige al usuario a un link."
          : "Muestra una pantalla final con CTA.",
      type,
      minScore: null,
      maxScore: null,
    };
    setLocalEndings((prev) => [...prev, next]);
    onSelectEnding?.(next.id);
  };

  const handleDeleteEnding = (id: string) => {
    const ending = displayEndings.find((e) => e.id === id);
    if (ending?.type === "lead_capture") return;
    if (onDeleteEnding) {
      onDeleteEnding(id);
      return;
    }
    setLocalEndings((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Questions */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Blocks</p>
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
            const isDragOver = dragOverId === q.id;
            return (
              <div
                key={`${q.id}-${index}`}
                className={[
                  "group flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition",
                  "transition-transform duration-150 ease-out",
                  isActive
                    ? "border-slate-300 bg-slate-50 shadow-sm"
                    : "border-transparent hover:border-slate-100 hover:bg-slate-50",
                  isDragOver ? "border-blue-200 bg-blue-50/50 translate-y-0.5" : "",
                  draggingId === q.id ? "opacity-80 scale-[0.99]" : "",
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
                  setDraggingId(q.id as string);
                }}
                onDragOver={(e) => {
                  if (!onReorder) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setDragOverId(q.id as string);
                }}
                onDragLeave={() => setDragOverId(null)}
                onDrop={(e) => {
                  if (!onReorder) return;
                  e.preventDefault();
                  const draggedId = e.dataTransfer.getData("text/plain");
                  if (!draggedId || draggedId === q.id) return;
                  onReorder(draggedId, index);
                  setDragOverId(null);
                  setDraggingId(null);
                }}
                onDragEnd={() => {
                  setDragOverId(null);
                  setDraggingId(null);
                }}
              >
                <span className="flex h-6 min-w-[32px] items-center justify-center gap-1 rounded-md bg-slate-100 px-1 text-[11px] font-semibold text-slate-700 cursor-grab active:cursor-grabbing">
                  <DragHandleDots2Icon className="h-3 w-3 text-slate-500" aria-hidden />
                  {index + 1}
                </span>
                <span className="flex-1 line-clamp-2 text-slate-700">{q.text || "Untitled"}</span>
                {(onDelete || onDuplicate) && (
                  <DropdownMenu.Root modal={false}>
                    <DropdownMenu.Trigger asChild>
                      <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className="hidden items-center rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 group-hover:flex data-[state=open]:flex"
                      >
                        <DotsHorizontalIcon className="h-4 w-4" aria-hidden />
                        <span className="sr-only">Acciones</span>
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        align="end"
                        sideOffset={6}
                        collisionPadding={8}
                        position="popper"
                        className="z-20 w-44 rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-lg ring-1 ring-black/5 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95"
                      >
                        {onDuplicate && (
                          <DropdownMenu.Item
                            onSelect={(e) => {
                              e.preventDefault();
                              onDuplicate(q.id);
                            }}
                            className="flex cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-slate-700 outline-none transition hover:bg-slate-50 data-[highlighted]:bg-slate-50"
                          >
                            <CopyIcon className="h-4 w-4" aria-hidden />
                            Duplicar
                          </DropdownMenu.Item>
                        )}
                        {onDelete && (
                          <DropdownMenu.Item
                            onSelect={(e) => {
                              e.preventDefault();
                              onDelete(q.id);
                            }}
                            className="flex cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-red-600 outline-none transition hover:bg-red-50 data-[highlighted]:bg-red-50"
                          >
                            <TrashIcon className="h-4 w-4" aria-hidden />
                            Eliminar
                          </DropdownMenu.Item>
                        )}
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                )}
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

      {/* Endings (separate panel) */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Endings
          </p>
          <DropdownMenu.Root modal={false}>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                +
                <span className="text-[11px]">Add</span>
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                collisionPadding={8}
                position="popper"
                className="z-30 w-60 rounded-xl border border-slate-200 bg-white p-2 text-sm shadow-lg ring-1 ring-black/5"
              >
                <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Choose an ending type
                </p>
                {endingTemplates.map((tpl) => (
                  <DropdownMenu.Item
                    key={tpl.type}
                    onSelect={(e) => {
                      e.preventDefault();
                      handleAddEnding(tpl.type);
                    }}
                    className="flex cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-slate-700 outline-none transition hover:bg-slate-50 data-[highlighted]:bg-slate-50"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-[11px] font-semibold text-slate-700">
                      {tpl.type === "redirect_url" ? "URL" : "END"}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-800">{tpl.label}</span>
                      <span className="text-[11px] text-slate-500">{tpl.description}</span>
                    </div>
                  </DropdownMenu.Item>
                ))}
                <DropdownMenu.Separator className="my-2 h-px bg-slate-100" />
                <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Post-submit actions
                </p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-400">
                    <span className="text-lg leading-none">⋯</span>
                    <div className="flex flex-col">
                      <span className="font-semibold">Connect to apps</span>
                      <span className="text-[11px] text-slate-400">Próximamente</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-400">
                    <span className="text-lg leading-none">✉</span>
                    <div className="flex flex-col">
                      <span className="font-semibold">Send messages</span>
                      <span className="text-[11px] text-slate-400">Próximamente</span>
                    </div>
                  </div>
                </div>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
        <div className="space-y-2 border-t border-slate-100 p-3">
          {displayEndings.map((ending, idx) => {
            const isActive = ending.id === selectedEndingId;
            const label = String.fromCharCode(65 + idx);
            const rangeLabel =
              ending.type === "lead_capture"
                ? "Lead capture"
                : ending.minScore !== undefined && ending.maxScore !== undefined
                  ? `${ending.minScore} to ${ending.maxScore}`
                  : "?? to ??";
            const typeBadge =
              ending.type === "redirect_url"
                ? "URL"
                : ending.type === "lead_capture"
                  ? "LEAD"
                  : "END";
            return (
              <div
                key={`${ending.id}-${idx}`}
                className={[
                  "group flex w-full items-start gap-3 rounded-xl border px-3 py-2 text-left text-sm transition",
                  isActive
                    ? "border-amber-300 bg-amber-50 shadow-sm"
                    : "border-transparent hover-border-amber-100 hover:bg-amber-50/60",
                  dragOverEndingId === ending.id ? "border-blue-200 bg-blue-50/50 translate-y-0.5" : "",
                  draggingEndingId === ending.id ? "opacity-80 scale-[0.99]" : "",
                ].join(" ")}
                role="button"
                tabIndex={0}
                onClick={() => ending.id && onSelectEnding?.(ending.id)}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && ending.id) onSelectEnding?.(ending.id);
                }}
                draggable={Boolean(onReorderEnding) && ending.type !== "lead_capture"}
                onDragStart={(e) => {
                  if (!onReorderEnding) return;
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", ending.id as string);
                  setDraggingEndingId(ending.id as string);
                }}
                onDragOver={(e) => {
                  if (!onReorderEnding) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setDragOverEndingId(ending.id as string);
                }}
                onDragLeave={() => setDragOverEndingId(null)}
                onDrop={(e) => {
                  if (!onReorderEnding) return;
                  e.preventDefault();
                  const draggedId = e.dataTransfer.getData("text/plain");
                  if (!draggedId || draggedId === ending.id) return;
                  const currentOrder = displayEndings.map((e) => e.id as string);
                  const from = currentOrder.indexOf(draggedId);
                  const to = currentOrder.indexOf(ending.id as string);
                  if (from === -1 || to === -1 || from === to) {
                    setDragOverEndingId(null);
                    setDraggingEndingId(null);
                    return;
                  }
                  const nextOrder = [...currentOrder];
                  const [moved] = nextOrder.splice(from, 1);
                  nextOrder.splice(to, 0, moved);
                  onReorderEnding(nextOrder);
                  setDragOverEndingId(null);
                  setDraggingEndingId(null);
                }}
                onDragEnd={() => {
                  setDragOverEndingId(null);
                  setDraggingEndingId(null);
                }}
              >
                <span className="flex h-6 min-w-[32px] items-center justify-center gap-1 rounded-md bg-amber-100 px-1 text-[11px] font-semibold text-amber-800">
                  {typeBadge}
                  <span className="rounded bg-amber-200 px-1 text-[10px] text-amber-900">{label}</span>
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{ending.title}</p>
                  <p className="text-xs text-slate-600">{ending.description}</p>
                  {ending.type !== "lead_capture" ? (
                    <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-100">
                      {rangeLabel}
                    </p>
                  ) : (
                    <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200">
                      Email gate
                    </p>
                  )}
                  {ending.url ? (
                    <p className="mt-1 text-xs text-blue-700">
                      {ending.urlLabel || "Link"}: {ending.url}
                    </p>
                  ) : null}
                </div>
                {ending.type !== "lead_capture" && (onDuplicateEnding || onDeleteEnding) ? (
                  <DropdownMenu.Root modal={false}>
                    <DropdownMenu.Trigger asChild>
                      <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className="hidden items-center rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 group-hover:flex data-[state=open]:flex"
                      >
                        <DotsHorizontalIcon className="h-4 w-4" aria-hidden />
                        <span className="sr-only">Acciones ending</span>
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        align="end"
                        sideOffset={6}
                        collisionPadding={8}
                        position="popper"
                        className="z-30 w-44 rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-lg ring-1 ring-black/5 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95"
                      >
                        {onDuplicateEnding && (
                          <DropdownMenu.Item
                            onSelect={(e) => {
                              e.preventDefault();
                              onDuplicateEnding(ending.id);
                            }}
                            className="flex cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-slate-700 outline-none transition hover:bg-slate-50 data-[highlighted]:bg-slate-50"
                          >
                            <CopyIcon className="h-4 w-4" aria-hidden />
                            Duplicar
                          </DropdownMenu.Item>
                        )}
                        {onDeleteEnding && (
                          <DropdownMenu.Item
                            onSelect={(e) => {
                              e.preventDefault();
                              handleDeleteEnding(ending.id);
                            }}
                            className="flex cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-red-600 outline-none transition hover:bg-red-50 data-[highlighted]:bg-red-50"
                          >
                            <TrashIcon className="h-4 w-4" aria-hidden />
                            Eliminar
                          </DropdownMenu.Item>
                        )}
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                ) : null}
              </div>
            );
          })}
          {!displayEndings.length && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-xs text-slate-500">
              No endings yet. Add a final screen or redirect.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default QuestionRail;

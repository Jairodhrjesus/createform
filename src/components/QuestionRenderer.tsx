"use client";

import { useMemo } from "react";
import * as Avatar from "@radix-ui/react-avatar";
import { DropdownSelect } from "@/components/ui/DropdownSelect";
import type { Schema } from "@/amplify/data/resource";
import { useQuestionOptions } from "@/hooks/useQuestionOptions";

type OptionType = Schema["Option"]["type"];
type QuestionType = Schema["Question"]["type"];

interface QuestionRendererProps {
  question: QuestionType;
  onAnswer: (questionId: string, options: OptionType[] | null, freeValue?: string) => void;
  selectedOptionIds: string[];
  displayOrder: number;
}

type ControlKind =
  | "radio"
  | "checkbox"
  | "dropdown"
  | "text"
  | "textarea"
  | "linear"
  | "rating"
  | "grid"
  | "none";

const sortOptions = (items: OptionType[]) =>
  items
    .slice()
    .sort((a, b) => {
      const scoreDiff = (a.score ?? 0) - (b.score ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      const aNum = Number(a.text);
      const bNum = Number(b.text);
      if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) return aNum - bNum;
      return (a.text || "").localeCompare(b.text || "");
    });

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

export default function QuestionRenderer({
  question,
  onAnswer,
  selectedOptionIds,
  displayOrder,
}: QuestionRendererProps) {
  const { options, loading } = useQuestionOptions(question.id as string, question.type);
  const type = question.type || "single_choice";

  const sortedOptions = useMemo(() => sortOptions(options), [options]);
  const control = useMemo<ControlKind>(() => {
    if (type === "short_text") return "text";
    if (type === "paragraph") return "textarea";
    if (type === "checkboxes") return "checkbox";
    if (type === "multi_grid" || type === "checkbox_grid") return "grid";
    if (type === "dropdown") return "dropdown";
    if (type === "linear_scale") return "linear";
    if (type === "rating") return "rating";
    if (type === "file_upload" || type === "date" || type === "time") return "none";
    return "radio";
  }, [type]);

  const renderChoiceList = () => {
    if (loading) return <p className="text-sm text-slate-500">Cargando opciones...</p>;
    if (!sortedOptions.length) {
      return <p className="text-sm text-slate-500">Este tipo no tiene opciones configuradas.</p>;
    }

    if (control === "dropdown") {
      return (
        <DropdownSelect
          value={selectedOptionIds[0] || ""}
          placeholder="Selecciona una opcion"
          options={sortedOptions.map((opt) => ({
            value: opt.id as string,
            label: opt.text || "",
          }))}
          onChange={(val) => {
            const opt = sortedOptions.find((o) => o.id === val);
            if (opt) onAnswer(question.id as string, [opt]);
          }}
          className="w-full justify-between"
          menuWidthClass="w-full"
        />
      );
    }

    const selectedSet = new Set(selectedOptionIds);

    return (
      <div className="space-y-3">
        {sortedOptions.map((option) => {
          const isChecked =
            control === "checkbox"
              ? selectedSet.has(option.id as string)
              : selectedSet.has(option.id as string);
          return (
            <label
              key={option.id}
              className={`flex items-center rounded-lg border px-3 py-2 text-sm transition ${
                isChecked ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <input
                type={control === "checkbox" ? "checkbox" : "radio"}
                name={`question-${question.id}`}
                value={option.id}
                checked={isChecked}
                onChange={() => {
                  if (control === "checkbox") {
                    const nextOptions = isChecked
                      ? sortedOptions.filter(
                          (o) => selectedSet.has(o.id as string) && o.id !== option.id
                        )
                      : sortedOptions
                          .filter((o) => selectedSet.has(o.id as string))
                          .concat(option);
                    onAnswer(question.id as string, nextOptions);
                  } else {
                    onAnswer(question.id as string, [option]);
                  }
                }}
                className="h-4 w-4 text-blue-600"
              />
              <span className="ml-3 text-slate-800">{option.text}</span>
            </label>
          );
        })}
      </div>
    );
  };

  const renderGrid = (controlType: "checkbox" | "radio") => {
    if (loading) return <p className="text-sm text-slate-500">Cargando cuadrícula...</p>;
    const cols =
      sortedOptions.length > 0
        ? sortedOptions.map((opt, idx) => opt.text || `Columna ${idx + 1}`)
        : ["Columna 1", "Columna 2"];
    const rows = ["Fila 1", "Fila 2"];

    return (
      <div className="space-y-2">
        <div className="overflow-auto rounded-xl border border-slate-200 bg-white shadow-inner">
          <div className="min-w-[320px]">
            <div className="grid grid-cols-[140px_repeat(auto-fill,minmax(120px,1fr))] border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <span>Filas</span>
              {cols.map((col, idx) => (
                <span key={`${col}-${idx}`} className="text-center">
                  {col}
                </span>
              ))}
            </div>
            <div className="divide-y divide-slate-200">
              {rows.map((row, rowIdx) => (
                <div
                  key={`${row}-${rowIdx}`}
                  className="grid grid-cols-[140px_repeat(auto-fill,minmax(120px,1fr))] items-center px-3 py-2 text-sm text-slate-700"
                >
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <span className="text-xs text-slate-400">{rowIdx + 1}.</span>
                    <span>{row}</span>
                  </div>
                  {cols.map((col, colIdx) => (
                    <label
                      key={`${row}-${col}-${colIdx}`}
                      className="flex items-center justify-center gap-2 text-xs text-slate-500"
                    >
                      <input
                        type={controlType}
                        disabled
                        className="h-4 w-4 text-blue-600"
                        name={`grid-row-${rowIdx}`}
                      />
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Respuestas en cuadrícula. Define filas/columnas en el editor (vista previa informativa).
        </p>
      </div>
    );
  };

  const renderLinearScale = () => {
    if (loading) return <p className="text-sm text-slate-500">Cargando escala...</p>;
    if (!sortedOptions.length) {
      return <p className="text-sm text-slate-500">Configura la escala 1-10 en el editor.</p>;
    }
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          {sortedOptions.map((opt) => {
            const isSelected = selectedOptionIds.includes(opt.id as string);
            return (
              <div key={opt.id} className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    onAnswer(question.id as string, isSelected ? [] : [opt])
                  }
                  className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  {opt.text}
                </button>
                <span className="text-[11px] font-medium text-slate-500">
                  {opt.score ?? 0} pts
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-slate-500">
          Selecciona un valor de la escala. Cada nivel suma su puntaje configurado.
        </p>
      </div>
    );
  };

  const renderRating = () => {
    if (loading) return <p className="text-sm text-slate-500">Cargando estrellas...</p>;
    if (!sortedOptions.length) {
      return <p className="text-sm text-slate-500">Configura el puntaje de cada estrella.</p>;
    }
    const selectedIndex = sortedOptions.findIndex((opt) =>
      selectedOptionIds.includes(opt.id as string)
    );

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {sortedOptions.map((opt, idx) => {
            const isActive = selectedIndex >= 0 ? idx <= selectedIndex : false;
            const handleClick = () => {
              if (selectedIndex === idx) {
                onAnswer(question.id as string, []);
              } else {
                onAnswer(question.id as string, [opt]);
              }
            };
            return (
              <button
                key={opt.id}
                type="button"
                onClick={handleClick}
                className="flex flex-col items-center gap-1"
              >
                <StarIcon filled={isActive} />
                <span className="text-[11px] font-medium text-slate-500">
                  {opt.score ?? 0} pts
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-slate-500">
          Haz clic en la estrella para asignar la calificacion y su puntaje.
        </p>
      </div>
    );
  };

  let content: JSX.Element;
  if (control === "text") {
    content = (
      <input
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
        placeholder="Tu respuesta..."
        onBlur={(e) => onAnswer(question.id as string, null, e.target.value)}
      />
    );
  } else if (control === "textarea") {
    content = (
      <textarea
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
        rows={3}
        placeholder="Escribe tu respuesta..."
        onBlur={(e) => onAnswer(question.id as string, null, e.target.value)}
      />
    );
  } else if (control === "linear") {
    content = renderLinearScale();
  } else if (control === "rating") {
    content = renderRating();
  } else if (control === "grid") {
    content = renderGrid("checkbox");
  } else if (control === "none") {
    content = (
      <p className="text-sm text-slate-500">
        Este tipo requiere logica personalizada (archivo/fecha/hora).
      </p>
    );
  } else {
    content = renderChoiceList();
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <Avatar.Root className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900/90 text-sm font-semibold text-white ring-2 ring-slate-100">
          <Avatar.Fallback className="select-none">{displayOrder}</Avatar.Fallback>
        </Avatar.Root>
        <h3 className="text-lg font-semibold text-slate-800 leading-tight">
          {question.text}
        </h3>
      </div>
      {content}
    </div>
  );
}

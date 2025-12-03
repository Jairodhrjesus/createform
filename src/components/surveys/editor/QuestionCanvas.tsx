"use client";

import { useEffect, useState } from "react";
import type { Schema } from "@/amplify/data/resource";
import OptionList, { supportsOptions } from "./OptionList";
import ShortTextPreview from "./question-types/ShortTextPreview";
import ParagraphPreview from "./question-types/ParagraphPreview";
import RadioPreview from "./question-types/RadioPreview";
import DropdownPreview from "./question-types/DropdownPreview";
import CheckboxPreview from "./question-types/CheckboxPreview";
import FilePreview from "./question-types/FilePreview";
import LinearScalePreview from "./question-types/LinearScalePreview";
import RatingPreview from "./question-types/RatingPreview";
import GridPreview from "./question-types/GridPreview";

type QuestionType = Schema["Question"]["type"];
type OptionType = Schema["Option"]["type"];

interface QuestionCanvasProps {
  question: QuestionType | null;
  options: OptionType[];
  optionsLoading?: boolean;
  onChangeText: (text: string) => void;
  onAddOption: (text: string, score?: number) => Promise<void>;
  onDeleteOption: (id: string) => Promise<void>;
  onUpdateOption?: (id: string, updates: Partial<OptionType>) => Promise<void>;
  onDeleteQuestion?: (id: string) => void;
}

export function QuestionCanvas({
  question,
  options,
  optionsLoading,
  onChangeText,
  onAddOption,
  onDeleteOption,
  onUpdateOption,
}: QuestionCanvasProps) {
  const [localText, setLocalText] = useState(question?.text || "");

  useEffect(() => {
    setLocalText(question?.text || "");
  }, [question?.text]);

  if (!question) {
    return (
      <div className="flex h-[640px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/70 text-center shadow-inner">
        <p className="text-base font-semibold text-slate-800">No question selected</p>
        <p className="mt-1 text-sm text-slate-500">
          Select a block on the left rail to preview it here.
        </p>
      </div>
    );
  }

  const renderPreview = () => {
    switch (question.type) {
      case "short_text":
        return <ShortTextPreview />;
      case "paragraph":
        return <ParagraphPreview placeholder="Respuesta larga..." />;
      case "single_choice":
        return <RadioPreview options={options} />;
      case "dropdown":
        return <DropdownPreview options={options} />;
      case "checkboxes":
        return <CheckboxPreview options={options} />;
      case "file_upload":
        return <FilePreview />;
      case "linear_scale":
        return <LinearScalePreview options={options} />;
      case "rating":
        return <RatingPreview options={options} />;
      case "multi_grid":
        return <GridPreview control="checkbox" options={options} />;
      case "checkbox_grid":
        return <GridPreview control="checkbox" options={options} />;
      case "date":
        return (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Fecha</label>
            <input
              type="date"
              disabled
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            />
          </div>
        );
      case "time":
        return (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Hora</label>
            <input
              type="time"
              disabled
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            />
          </div>
        );
      default:
        return <ShortTextPreview placeholder="Type your answer here..." />;
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="absolute inset-x-0 top-0 h-2 rounded-t-3xl bg-slate-50" />
      <div className="p-6 sm:p-10 lg:p-12">
        <div className="mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {question.order || 1}
              </span>
              <span className="text-slate-400">Question</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Texto de la pregunta
            </label>
            <input
              value={localText}
              onChange={(e) => setLocalText(e.target.value)}
              onBlur={() => onChangeText(localText)}
              placeholder="Tu pregunta aqui. Usa @ para referencias."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-lg font-semibold text-slate-800 shadow-inner focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
            />
            <p className="text-sm text-slate-500">Descripcion (opcional)</p>
          </div>

          <div className="mt-6 space-y-4">{renderPreview()}</div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Contenido enriquecido
            </p>
            <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Subir imagen (placeholder)
              </button>
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Agregar video (URL)
              </button>
              <p className="text-xs text-slate-500">
                Este bloque es informativo; implementa persistencia de media mas adelante.
              </p>
            </div>
          </div>

          <div className="pt-4">
            {question.type === "linear_scale" ? (
              <LinearScaleConfigurator
                options={options}
                loading={optionsLoading}
                onUpdate={onUpdateOption}
              />
            ) : question.type === "rating" ? (
              <RatingConfigurator
                options={options}
                loading={optionsLoading}
                onUpdate={onUpdateOption}
                onAddOption={onAddOption}
                onDeleteOption={onDeleteOption}
              />
            ) : supportsOptions(question.type || "") ? (
              <OptionList
                options={options}
                loading={optionsLoading}
                onAdd={onAddOption}
                onDelete={onDeleteOption}
                onUpdate={onUpdateOption}
                questionType={question.type || undefined}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuestionCanvas;

function LinearScaleConfigurator({
  options,
  loading,
  onUpdate,
}: {
  options: OptionType[];
  loading?: boolean;
  onUpdate?: (id: string, updates: Partial<OptionType>) => Promise<void>;
}) {
  const parseIndex = (value?: string | null) => {
    const num = Number(value);
    return Number.isNaN(num) ? undefined : num;
  };

  const scales = options.length
    ? options
        .slice()
        .sort((a, b) => {
          const aNum = parseIndex(a.text);
          const bNum = parseIndex(b.text);
          if (aNum !== undefined && bNum !== undefined) return aNum - bNum;
          return (a.text || "").localeCompare(b.text || "");
        })
        .map((opt, idx) => ({
          ...opt,
          text: opt.text || String(idx + 1),
        }))
    : Array.from({ length: 10 }, (_, idx) => ({
        id: `scale-${idx + 1}`,
        text: String(idx + 1),
        score: 1,
      }));

  return (
    <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Escala lineal 1-10
          </p>
          <p className="text-xs text-slate-500">
            Cada paso tiene su propio puntaje. Por defecto 1 punto por escala.
          </p>
        </div>
        <span className="rounded-full bg-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700">
          {scales.length} items
        </span>
      </div>
      {loading ? (
        <p className="text-xs text-slate-500">Cargando escala...</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {scales.map((scale) => (
            <div
              key={scale.id || scale.text}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800">
                  {scale.text}
                </span>
                <span className="text-xs text-slate-500">{scale.score ?? 1} pts</span>
              </div>
              <input
                type="number"
                className="w-16 rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-200"
                defaultValue={scale.score ?? 1}
                onBlur={(e) => {
                  if (!scale.id) return;
                  const nextScore = parseInt(e.target.value || "0", 10) || 0;
                  if (nextScore === (scale.score ?? 1)) return;
                  onUpdate?.(scale.id as string, { score: nextScore });
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RatingConfigurator({
  options,
  loading,
  onUpdate,
  onAddOption,
  onDeleteOption,
}: {
  options: OptionType[];
  loading?: boolean;
  onUpdate?: (id: string, updates: Partial<OptionType>) => Promise<void>;
  onAddOption: (text: string, score?: number) => Promise<void>;
  onDeleteOption: (id: string) => Promise<void>;
}) {
  const parseIndex = (value?: string | null) => {
    const num = Number(value);
    if (!Number.isNaN(num)) return num;
    const match = (value || "").match(/(\d+)/);
    return match ? Number(match[1]) : undefined;
  };

  const stars = options.length
    ? options
        .slice()
        .sort((a, b) => {
          const aNum = parseIndex(a.text);
          const bNum = parseIndex(b.text);
          if (aNum !== undefined && bNum !== undefined) return aNum - bNum;
          return (a.text || "").localeCompare(b.text || "");
        })
        .map((opt, idx) => ({
          ...opt,
          text: opt.text || String(idx + 1),
        }))
    : Array.from({ length: 5 }, (_, idx) => ({
        id: `star-${idx + 1}`,
        text: String(idx + 1),
        score: 1,
      }));

  const nextIndex =
    stars.reduce((max, star) => Math.max(max, parseIndex(star.text) || 0), 0) + 1;

  const addStar = async () => {
    await onAddOption(`Estrella ${nextIndex}`, 1);
  };

  return (
    <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Calificacion (estrellas)
          </p>
          <p className="text-xs text-slate-500">
            Ajusta el puntaje de cada estrella. Por defecto 1 punto.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={addStar}
            className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Agregar estrella
          </button>
          <span className="rounded-full bg-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700">
            {stars.length} items
          </span>
        </div>
      </div>
      {loading ? (
        <p className="text-xs text-slate-500">Cargando estrellas...</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {stars.map((star, idx) => (
            <div
              key={star.id || star.text}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <span className="text-base text-amber-500">★</span>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-800">
                    Estrella {idx + 1}
                  </span>
                  <span className="text-xs text-slate-500">{star.score ?? 1} pts</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="w-16 rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-200"
                  defaultValue={star.score ?? 1}
                  onBlur={(e) => {
                    if (!star.id) return;
                    const nextScore = parseInt(e.target.value || "0", 10) || 0;
                    if (nextScore === (star.score ?? 1)) return;
                    onUpdate?.(star.id as string, { score: nextScore });
                  }}
                />
                {star.id && (
                  <button
                    type="button"
                    onClick={() => onDeleteOption(star.id as string)}
                    className="text-xs font-semibold text-red-600 hover:text-red-700"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

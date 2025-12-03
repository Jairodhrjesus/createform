"use client";

import { useState, useEffect } from "react";
import { client } from "@/utils/amplify-utils";
import type { Schema } from "@/amplify/data/resource";
import Modal from "./ui/Modal";

interface OutcomeManagerProps {
  surveyId: string;
}

export default function OutcomeManager({ surveyId }: OutcomeManagerProps) {
  const [outcomes, setOutcomes] = useState<Schema["Outcome"]["type"][]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newMin, setNewMin] = useState(0);
  const [newMax, setNewMax] = useState(10);
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const sub = client.models.Outcome.observeQuery({
      filter: { surveyId: { eq: surveyId } },
    }).subscribe({
      next: ({ items }) =>
        setOutcomes(items.slice().sort((a, b) => (a.minScore || 0) - (b.minScore || 0))),
    });
    return () => sub.unsubscribe();
  }, [surveyId]);

  const resetForm = () => {
    setNewTitle("");
    setNewMin(0);
    setNewMax(10);
    setNewDesc("");
  };

  const handleCreateOutcome = async () => {
    setFeedback(null);
    if (!newTitle.trim() || newMin >= newMax) {
      setFeedback("Necesitas un titulo y que el minimo sea menor que el maximo.");
      return;
    }
    setSaving(true);
    const { errors } = await client.models.Outcome.create(
      {
        surveyId: surveyId,
        title: newTitle.trim(),
        minScore: newMin,
        maxScore: newMax,
        description: newDesc || "Define el resultado aqui",
      } as unknown as Schema["Outcome"]["createType"]
    );

    if (errors) {
      console.error("Error al crear el resultado:", errors);
      setFeedback("No se pudo guardar el rango. Revisa la consola.");
    } else {
      resetForm();
      setFeedback("Rango guardado.");
    }
    setSaving(false);
  };

  const handleDeleteOutcome = async () => {
    if (!deleteId) return;
    await client.models.Outcome.delete({ id: deleteId });
    setDeleteId(null);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Rangos de resultados
            </p>
            <h3 className="text-lg font-semibold text-slate-900">
              Define tramos de puntaje
            </h3>
            <p className="text-sm text-slate-600">
              Crea rangos [min - max] y asigna un Outcome que vera el usuario.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {outcomes.length} definidos
          </span>
        </div>

        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-semibold text-slate-800">
                Titulo del Outcome
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder='Ej: "Perfil Lider"'
                aria-label="Titulo del Outcome"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-800">
                Puntaje minimo
              </label>
              <input
                type="number"
                value={newMin}
                onChange={(e) => setNewMin(parseInt(e.target.value, 10) || 0)}
                aria-label="Puntaje minimo"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-800">
                Puntaje maximo
              </label>
              <input
                type="number"
                value={newMax}
                onChange={(e) => setNewMax(parseInt(e.target.value, 10) || 0)}
                aria-label="Puntaje maximo"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="text-sm font-semibold text-slate-800">
              Descripcion (opcional)
            </label>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={2}
              placeholder="Describe lo que vera el usuario si cae en este rango."
              aria-label="Descripcion del Outcome"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
          {feedback && (
            <p className="mt-3 text-xs font-medium text-slate-600">{feedback}</p>
          )}
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={handleCreateOutcome}
              disabled={saving}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Guardar rango"}
            </button>
            <button
              onClick={resetForm}
              type="button"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {outcomes.map((o) => (
          <div
            key={o.id}
            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                {o.minScore} - {o.maxScore} pts
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">{o.title}</p>
                {o.description && (
                  <p className="text-xs text-slate-500">{o.description}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setDeleteId(o.id as string)}
              className="self-start rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
            >
              Eliminar
            </button>
          </div>
        ))}

        {outcomes.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-8 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-800">Sin outcomes aun</p>
            <p className="text-xs text-slate-500 mt-1">
              Crea tu primer rango para mapear puntajes a resultados.
            </p>
          </div>
        )}
      </div>

      <Modal
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title="Eliminar Outcome"
        description="Se eliminara este rango de resultados."
        footer={
          <>
            <button
              onClick={() => setDeleteId(null)}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteOutcome}
              className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
            >
              Eliminar
            </button>
          </>
        }
      />
    </div>
  );
}

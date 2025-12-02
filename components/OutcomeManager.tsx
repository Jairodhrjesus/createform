"use client";

import { useState, useEffect } from "react";
import { client } from "@/utils/amplify-utils";
import type { Schema } from "@/amplify/data/resource";

interface OutcomeManagerProps {
  surveyId: string;
}

export default function OutcomeManager({ surveyId }: OutcomeManagerProps) {
  const [outcomes, setOutcomes] = useState<Schema["Outcome"]["type"][]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newMin, setNewMin] = useState(0);
  const [newMax, setNewMax] = useState(10);

  // 1. Cargar y suscribirse a los resultados
  useEffect(() => {
    const sub = client.models.Outcome.observeQuery({
      filter: { surveyId: { eq: surveyId } },
    }).subscribe({
      next: ({ items }) =>
        setOutcomes(items.sort((a, b) => a.minScore - b.minScore)),
    });
    return () => sub.unsubscribe();
  }, [surveyId]);

  // 2. Crear un nuevo rango de resultado
  const handleCreateOutcome = async () => {
    if (!newTitle.trim() || newMin >= newMax) {
      alert(
        "Asegúrate de poner un título y que el mínimo sea menor que el máximo."
      );
      return;
    }

    const { errors } = await client.models.Outcome.create(
      {
        surveyId: surveyId,
        title: newTitle,
        minScore: newMin,
        maxScore: newMax,
        description: "Describe el resultado aquí...",
      } as unknown as Schema["Outcome"]["createType"]
    );

    if (errors) {
      console.error("Error al crear el resultado:", errors);
      alert("Error al crear el resultado. Revisa la consola.");
    }

    // Limpiar formulario
    setNewTitle("");
    setNewMin(0);
    setNewMax(10);
  };

  // 3. Borrar resultado
  const handleDeleteOutcome = async (id: string) => {
    if (confirm("¿Borrar este resultado?")) {
      await client.models.Outcome.delete({ id });
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border mt-8">
      <h3 className="text-xl font-bold mb-4 text-gray-800">
        Definir Rangos de Resultados (Outcomes)
      </h3>

      {/* Formulario de creación */}
      <div className="grid grid-cols-5 gap-3 mb-6 p-4 border rounded-lg bg-gray-50">
        <input
          type="text"
          placeholder="Título del Resultado (Ej: Perfil Líder)"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="col-span-2 p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Min Score"
          value={newMin}
          onChange={(e) => setNewMin(parseInt(e.target.value) || 0)}
          className="p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Max Score"
          value={newMax}
          onChange={(e) => setNewMax(parseInt(e.target.value) || 0)}
          className="p-2 border rounded"
        />
        <button
          onClick={handleCreateOutcome}
          className="bg-green-600 text-white p-2 rounded hover:bg-green-700"
        >
          Guardar Rango
        </button>
      </div>

      {/* Lista de resultados */}
      <div className="space-y-3">
        {outcomes.map((o) => (
          <div
            key={o.id}
            className="flex justify-between items-center p-3 bg-white border rounded"
          >
            <span className="font-mono text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {o.minScore} - {o.maxScore} pts
            </span>
            <span className="font-semibold text-gray-800">{o.title}</span>
            <button
              onClick={() => handleDeleteOutcome(o.id)}
              className="text-red-500 hover:text-red-700 text-xs"
            >
              Borrar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

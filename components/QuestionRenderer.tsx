"use client";

import { useState, useEffect } from "react";
import { client } from "@/utils/amplify-utils";
import type { Schema } from "@/amplify/data/resource";

type OptionType = Schema["Option"]["type"];

interface QuestionRendererProps {
  question: Schema["Question"]["type"];
  // Se llama cuando se selecciona una respuesta, pasando la opción completa
  onAnswer: (questionId: string, option: OptionType) => void;
  selectedOptionId: string | null;
  displayOrder: number;
}

/**
 * Carga las opciones de una pregunta específica y las renderiza como radio buttons.
 */
export default function QuestionRenderer({
  question,
  onAnswer,
  selectedOptionId,
  displayOrder,
}: QuestionRendererProps) {
  const [options, setOptions] = useState<OptionType[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar opciones de esta pregunta en tiempo real
  useEffect(() => {
    const sub = client.models.Option.observeQuery({
      filter: { questionId: { eq: question.id } },
    }).subscribe({
      next: ({ items }) => {
        setOptions(items);
        setLoading(false);
      },
    });
    return () => sub.unsubscribe();
  }, [question.id]);

  return (
    <div className="border p-4 rounded-lg bg-gray-50">
      <h3 className="font-semibold text-lg mb-4 text-gray-800">
        {displayOrder}. {question.text}
      </h3>

      {loading ? (
        <p className="text-sm text-gray-500">Cargando opciones...</p>
      ) : (
        <div className="space-y-3">
          {options.map((option) => (
            <label
              key={option.id}
              className={`flex items-center p-3 rounded-lg cursor-pointer transition 
                ${
                  selectedOptionId === option.id
                    ? "bg-blue-100 border-blue-600 border-2 shadow-md"
                    : "bg-white border hover:bg-gray-100"
                }`}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option.id}
                checked={selectedOptionId === option.id}
                onChange={() => onAnswer(question.id, option)}
                className="form-radio h-5 w-5 text-blue-600 border-gray-300"
              />
              <span className="ml-3 text-gray-700">{option.text}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

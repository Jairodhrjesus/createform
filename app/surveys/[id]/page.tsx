"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { client } from "@/utils/amplify-utils";
import type { Schema } from "@/amplify/data/resource";
import OutcomeManager from "@/components/OutcomeManager";

type QuestionType = Schema["Question"]["type"];
type OptionType = Schema["Option"]["type"];

interface OptionManagerProps {
  questionId: string;
  questionText: string;
}

const OptionManager = ({ questionId, questionText }: OptionManagerProps) => {
  const [options, setOptions] = useState<OptionType[]>([]);

  useEffect(() => {
    const sub = client.models.Option.observeQuery({
      filter: { questionId: { eq: questionId } },
    }).subscribe({
      next: ({ items }) =>
        setOptions(items.slice().sort((a, b) => a.score - b.score)),
    });
    return () => sub.unsubscribe();
  }, [questionId]);

  const addOption = async () => {
    const text = prompt(`Opcion para: "${questionText}"`);
    if (!text) return;

    const scoreStr = prompt(
      `Puntaje para la opcion "${text}" (Solo numeros, ej: 10)`,
      "0"
    );
    const score = parseInt(scoreStr || "0", 10);

    const { data } = await client.models.Option.create({
      questionId,
      text,
      score,
    } as unknown as Schema["Option"]["createType"]);

    if (data) {
      setOptions((prev) => [...prev, data].sort((a, b) => a.score - b.score));
    }
  };

  const deleteOption = async (id: string) => {
    if (window.confirm("¿Borrar esta opcion?")) {
      await client.models.Option.delete({ id });
      setOptions((prev) => prev.filter((opt) => opt.id !== id));
    }
  };

  return (
    <div className="mt-3 pl-4 border-l-2 border-gray-200">
      <p className="text-xs font-bold text-gray-500 uppercase mb-2">
        Opciones de respuesta:
      </p>
      <ul className="space-y-2">
        {options.map((opt) => (
          <li
            key={opt.id}
            className="text-sm flex justify-between bg-gray-50 p-2 rounded items-center"
          >
            <span className="text-black">
              {opt.text}{" "}
              <strong className="text-blue-600">({opt.score} pts)</strong>
            </span>
            <button
              onClick={() => deleteOption(opt.id)}
              className="text-red-400 hover:text-red-600 transition text-xs"
            >
              [Borrar]
            </button>
          </li>
        ))}
      </ul>
      <button
        onClick={addOption}
        className="mt-2 text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
      >
        + Añadir Opcion
      </button>
    </div>
  );
};

export default function SurveyEditor() {
  const params = useParams();
  const surveyId = params.id as string;

  const [survey, setSurvey] = useState<Schema["Survey"]["type"] | null>(null);
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [newQText, setNewQText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!surveyId) return;

    client.models.Survey.get({ id: surveyId }).then(({ data }) =>
      setSurvey(data)
    );

    const sub = client.models.Question.observeQuery({
      filter: { surveyId: { eq: surveyId } },
    }).subscribe({
      next: ({ items }) => {
        setQuestions(
          items
            .slice()
            .sort((a, b) => ((a.createdAt || "") > (b.createdAt || "") ? 1 : -1))
        );
        setLoading(false);
      },
    });

    return () => sub.unsubscribe();
  }, [surveyId]);

  const addQuestion = async () => {
    if (!newQText.trim()) return;

    const { data } = await client.models.Question.create({
      surveyId: surveyId,
      text: newQText,
      order: questions.length + 1,
    } as unknown as Schema["Question"]["createType"]);

    if (data) {
      setQuestions((prev) =>
        [...prev, data].sort((a, b) =>
          (a.createdAt || "") > (b.createdAt || "") ? 1 : -1
        )
      );
    }

    setNewQText("");
  };

  const deleteQuestion = async (id: string) => {
    if (window.confirm("¿Borrar pregunta y todas sus opciones?")) {
      await client.models.Question.delete({ id });
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-600">Cargando editor...</div>;
  if (!survey) return <div className="p-8 text-center text-red-600">Encuesta no encontrada.</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-black p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            ← Volver al Dashboard
          </Link>
          <h1 className="text-4xl font-extrabold mt-2 text-gray-800">
            {survey.title}
          </h1>
          <p className="text-lg text-gray-500 mt-1">{survey.description}</p>
        </div>

        <OutcomeManager surveyId={surveyId} />

        <div className="bg-white p-6 rounded-lg mb-8 shadow-lg border mt-8">
          <h3 className="text-2xl font-bold mb-4">Añadir Pregunta</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={newQText}
              onChange={(e) => setNewQText(e.target.value)}
              placeholder="Escribe la nueva pregunta..."
              className="flex-1 p-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={addQuestion}
              className="bg-black text-white px-5 py-3 rounded-lg hover:bg-gray-800 font-semibold transition"
              disabled={!newQText.trim()}
            >
              Añadir Pregunta
            </button>
          </div>
        </div>

        <h2 className="text-3xl font-bold mb-4 text-gray-800 border-b pb-2">
          Estructura de la Encuesta
        </h2>
        <div className="space-y-6">
          {questions.map((q, index) => (
            <div
              key={q.id}
              className="border p-6 rounded-lg shadow-md bg-white relative group"
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xl font-medium">
                  <span className="text-gray-400 mr-2 font-mono">
                    #{index + 1}
                  </span>
                  {q.text}
                </h4>
                <button
                  onClick={() => deleteQuestion(q.id)}
                  className="text-red-500 hover:text-red-700 transition text-sm"
                >
                  [Eliminar]
                </button>
              </div>

              <OptionManager questionId={q.id} questionText={q.text} />
            </div>
          ))}

          {questions.length === 0 && (
            <p className="text-center text-gray-500 py-10 border border-dashed rounded-lg bg-white">
              Aun no hay preguntas. Añade la primera!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

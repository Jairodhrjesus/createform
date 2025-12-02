"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { client } from "@/utils/amplify-utils";
import type { Schema } from "@/amplify/data/resource";
import QuestionRenderer from "@/components/QuestionRenderer";

// Definición de tipos para la respuesta que se guarda en el estado local
interface AnswerData {
  questionId: string;
  optionId: string;
  score: number;
}

// Genera un ID anónimo único para el encuestado (requiere entorno de navegador)
const generateRespondentId = () => {
    // Usamos window.crypto para generar un ID único, necesario para submissions públicas
    return (typeof window !== 'undefined' && window.crypto.randomUUID) 
           ? window.crypto.randomUUID() 
           : `anon-${Date.now()}`;
};


export default function PublicSurveyView() {
  const params = useParams();
  const surveyId = params.id as string;

  const [survey, setSurvey] = useState<Schema["Survey"]["type"] | null>(null);
  const [questions, setQuestions] = useState<Schema["Question"]["type"][]>([]);
  const [outcomes, setOutcomes] = useState<Schema["Outcome"]["type"][]>([]);
  
  const [answers, setAnswers] = useState<Record<string, AnswerData>>({});
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [finalOutcome, setFinalOutcome] = useState<Schema["Outcome"]["type"] | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Cargar todo: Encuesta, Preguntas y Resultados (Outcomes)
  useEffect(() => {
    if (!surveyId) return;
    
    // Las suscripciones en esta vista pública utilizan la Public API Key
    client.models.Survey.get({ id: surveyId }).then(({ data: s }) => {
        setSurvey(s);
        setLoading(false);
    });
    
    const qSub = client.models.Question.observeQuery({
        filter: { surveyId: { eq: surveyId } },
    }).subscribe({
        next: ({ items }) => setQuestions(items.sort((a, b) => (a.order || 0) - (b.order || 0))),
    });
    
    const oSub = client.models.Outcome.observeQuery({
        filter: { surveyId: { eq: surveyId } },
    }).subscribe({
        next: ({ items }) => setOutcomes(items.sort((a, b) => a.minScore - b.minScore)),
    });

    return () => {
        qSub.unsubscribe();
        oSub.unsubscribe();
    };
  }, [surveyId]);

  // 2. Manejar la selección de respuestas
  const handleAnswer = (questionId: string, option: Schema["Option"]["type"]) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        questionId: questionId,
        optionId: option.id,
        score: option.score || 0,
      },
    }));
  };
  
  // 3. Lógica de Mapeo de Puntaje a Resultado
  const calculateOutcome = (totalScore: number): Schema["Outcome"]["type"] | null => {
      // Usa <= para Max Score, asegurando que el puntaje final caiga en el rango
      return outcomes.find(o => 
          totalScore >= (o.minScore || 0) && totalScore <= (o.maxScore || 0)
      ) || null;
  };

  // 4. ENVIAR y Guardar Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(answers).length !== questions.length) {
      alert("Por favor, responde todas las preguntas.");
      return;
    }

    // Calcular puntaje total
    const totalScore = Object.values(answers).reduce((sum, answer) => sum + (answer.score || 0), 0);
    
    // Mapear al resultado (Outcome)
    const matchedOutcome = calculateOutcome(totalScore);

    // Payload de la Submission
    const submissionPayload = {
      surveyId: surveyId,
      totalScore: totalScore,
      outcomeTitle: matchedOutcome?.title || "Resultado No Definido", 
      
      // <<<< CORRECCIÓN CRÍTICA: Serializamos el objeto de respuestas a JSON string >>>>
      answersContent: JSON.stringify(answers), 
      
      respondentId: generateRespondentId(),
    };
    
    // Guardar la respuesta en la base de datos (Submission)
    const { errors } = await client.models.Submission.create(
        submissionPayload as unknown as Schema["Submission"]["createType"],
        { authMode: 'apiKey' } // Fuerza el uso de la llave pública
    );
    
    if (errors) {
        // Mantenemos la lógica de debug mejorada
        console.error("Error al guardar Submission:", JSON.stringify(errors, null, 2)); 
        
        let errorMessage = `Hubo un error al guardar tu respuesta.`;
        if (errors[0] && errors[0].message) {
             if (errors[0].message.includes('Unauthorized') || errors[0].message.includes('Forbidden')) {
                 errorMessage = `ERROR DE PERMISOS: No se pudo guardar. El servidor denegó la operación (Verifica resource.ts y API Key).`;
             } else {
                 errorMessage += ` Detalle: ${errors[0].message}`;
             }
        }
        
        alert(errorMessage);
        return;
    }

    setFinalOutcome(matchedOutcome);
    setIsSubmitted(true);
  };

  if (loading) return <div className="text-center p-10">Cargando encuesta...</div>;
  if (!survey || questions.length === 0) return <div className="text-center p-10 text-red-500">Encuesta no encontrada o sin preguntas.</div>;

  const totalAnswered = Object.keys(answers).length;
  const totalQuestions = questions.length;

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow-xl rounded-lg border my-8">
      <h1 className="text-3xl font-bold mb-2 text-blue-800">{survey.title}</h1>
      <p className="text-gray-600 mb-8 border-b pb-4">{survey.description}</p>

      {isSubmitted ? (
        <div className="text-center p-10 bg-green-50 rounded-lg border-green-300 border-2">
          <h2 className="text-2xl font-bold text-green-700">¡Tu resultado ha sido calculado!</h2>
          <p className="mt-4 text-gray-800">Puntaje total: <strong className="text-3xl font-extrabold text-blue-600">{Object.values(answers).reduce((sum, a) => sum + (a.score || 0), 0)}</strong> puntos.</p>
          
          {finalOutcome ? (
              <div className="mt-6 p-4 bg-white rounded border shadow-md">
                  <h3 className="text-2xl font-bold text-blue-900 mb-2">{finalOutcome.title}</h3>
                  <p className="mt-2 text-gray-600">{finalOutcome.description}</p>
                  {finalOutcome.redirectUrl && (
                      <a href={finalOutcome.redirectUrl} target="_blank" className="mt-4 inline-block text-blue-500 hover:underline font-semibold">
                          Ir a la oferta recomendada →
                      </a>
                  )}
              </div>
          ) : (
             <p className="mt-6 text-yellow-600 font-medium">No encontramos un resultado (Outcome) para este puntaje. ¡El administrador debe definir los rangos!</p>
          )}
          
          <p className="text-xs mt-6 text-gray-400">Tu respuesta ha sido guardada.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Indicador de progreso */}
          <div className="text-sm text-gray-600 mb-4 flex justify-between">
            <span>Progreso: {totalAnswered} / {totalQuestions}</span>
            <div className="w-1/2 bg-gray-200 rounded-full h-2.5 mt-1">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(totalAnswered / totalQuestions) * 100}%` }}></div>
            </div>
          </div>
          
          {questions.map((q, index) => (
            <QuestionRenderer 
                key={q.id}
                question={q}
                onAnswer={handleAnswer}
                selectedOptionId={answers[q.id]?.optionId || null}
                displayOrder={q.order || index + 1}
            />
          ))}

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:bg-gray-400"
            disabled={totalAnswered !== totalQuestions}
          >
            {totalAnswered !== totalQuestions
                ? `Faltan ${totalQuestions - totalAnswered} preguntas para finalizar`
                : 'Finalizar Encuesta y Obtener Puntaje'
            }
          </button>
        </form>
      )}
    </div>
  );
}
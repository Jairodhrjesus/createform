"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { client } from "@/utils/amplify-utils";
import type { Schema } from "@/amplify/data/resource";
import QuestionRenderer from "@/components/QuestionRenderer";
import EmailGate from "@/components/EmailGate";

// Definicion de tipos para la respuesta que se guarda en el estado local
interface AnswerData {
  questionId: string;
  optionIds: string[];
  score: number;
}

// Genera un ID anonimo unico para el encuestado (requiere entorno de navegador)
const generateRespondentId = () => {
  // Usamos window.crypto para generar un ID unico, necesario para submissions publicas
  return typeof window !== "undefined" && window.crypto.randomUUID
    ? window.crypto.randomUUID()
    : `anon-${Date.now()}`;
};

export default function PublicSurveyView() {
  const params = useParams();
  const surveyId = (params?.id as string) || "";

  const [survey, setSurvey] = useState<Schema["Survey"]["type"] | null>(null);
  const [questions, setQuestions] = useState<Schema["Question"]["type"][]>([]);
  const [outcomes, setOutcomes] = useState<Schema["Outcome"]["type"][]>([]);
  const [isInactive, setIsInactive] = useState(false);

  const [answers, setAnswers] = useState<Record<string, AnswerData>>({});

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [finalOutcome, setFinalOutcome] = useState<Schema["Outcome"]["type"] | null>(null);
  const [showEmailGate, setShowEmailGate] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [savingLead, setSavingLead] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [loading, setLoading] = useState(true);

  // 1. Cargar todo: Encuesta, Preguntas y Resultados (Outcomes)
  useEffect(() => {
    if (!surveyId) return;

    // Las suscripciones en esta vista publica utilizan la Public API Key
    client.models.Survey.get({ id: surveyId }).then(({ data: s }) => {
      setSurvey(s);
      setIsInactive(!s?.isActive);
      setLoading(false);
      if (!s?.isActive) return;
    });

    // Si esta inactiva no suscribimos preguntas/outcomes
    if (isInactive) return;

    const qSub = client.models.Question.observeQuery({
      filter: { surveyId: { eq: surveyId } },
    }).subscribe({
      next: ({ items }) =>
        setQuestions(items.sort((a, b) => (a.order || 0) - (b.order || 0))),
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
  }, [surveyId, isInactive]);

  useEffect(() => {
    // Ajusta el paso si la lista de preguntas cambia
    if (questions.length === 0) {
      setCurrentStep(0);
      setShowEmailGate(false);
    } else if (currentStep > questions.length - 1) {
      setCurrentStep(questions.length - 1);
    }
  }, [questions, currentStep]);

  // 2. Manejar la seleccion de respuestas
  const handleAnswer = (questionId: string, opts: Schema["Option"]["type"][] | null) => {
    const optionIds = opts?.map((o) => o.id as string) || [];
    const score = opts?.reduce((acc, o) => acc + (o.score || 0), 0) || 0;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        questionId,
        optionIds,
        score,
      },
    }));
    setLeadError(null);
  };

  // 3. Logica de Mapeo de Puntaje a Resultado
  const calculateOutcome = (totalScore: number): Schema["Outcome"]["type"] | null => {
    // Usa <= para Max Score, asegurando que el puntaje final caiga en el rango
    return (
      outcomes.find(
        (o) => totalScore >= (o.minScore || 0) && totalScore <= (o.maxScore || 0)
      ) || null
    );
  };

  const totalAnswered = useMemo(() => Object.keys(answers).length, [answers]);
  const totalQuestions = questions.length;
  const progressValue = Math.min(totalAnswered, totalQuestions);

  const leadConfig = useMemo(() => {
    return {
      title: survey?.leadCaptureTitle || "Ultimo paso: recibe tu resultado por email",
      subtitle:
        survey?.leadCaptureSubtitle ||
        "Ingresa tu correo y (opcional) tu nombre para enviarte el resumen del resultado.",
      ctaLabel: survey?.leadCaptureCtaLabel || "Ver resultado",
      disclaimer:
        survey?.leadCaptureDisclaimer ||
        "Guardamos tu resultado y te enviamos el enlace en tu correo.",
      collectName: survey?.leadCaptureCollectName ?? true,
      requireName: survey?.leadCaptureRequireName ?? false,
      collectEmail: true, // Email es obligatorio para el lead capture
      requireEmail: true,
    };
  }, [survey]);

  const goNext = () => {
    const currentQuestion = questions[currentStep];
    if (!currentQuestion) return;
    const answered = answers[currentQuestion.id];
    if (!answered) {
      setLeadError("Responde la pregunta para continuar.");
      return;
    }
    if (currentStep === totalQuestions - 1) {
      setShowEmailGate(true);
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, totalQuestions - 1));
  };

  const goPrev = () => {
    setLeadError(null);
    setShowEmailGate(false);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleLeadSubmit = async ({ name, email }: { name: string; email: string }) => {
    if (totalAnswered !== totalQuestions) {
      setLeadError("Responde todas las preguntas antes de continuar.");
      setShowEmailGate(false);
      return;
    }
    setLeadError(null);
    setSavingLead(true);
    setLeadName(name);
    setLeadEmail(email);

    const totalScore = Object.values(answers).reduce(
      (sum, answer) => sum + (answer.score || 0),
      0
    );
    const matchedOutcome = calculateOutcome(totalScore);

    const submissionPayload = {
      surveyId: surveyId,
      totalScore,
      outcomeTitle: matchedOutcome?.title || "Resultado No Definido",
      answersContent: JSON.stringify(answers),
      respondentId: generateRespondentId(),
      respondentName: name,
      respondentEmail: email,
    };

    const { errors } = await client.models.Submission.create(
      submissionPayload as unknown as Schema["Submission"]["createType"],
      { authMode: "apiKey" }
    );

    setSavingLead(false);

    if (errors) {
      console.error("Error al guardar Submission:", JSON.stringify(errors, null, 2));

      let errorMessage = `Hubo un error al guardar tu respuesta.`;
      if (errors[0] && errors[0].message) {
        if (
          errors[0].message.includes("Unauthorized") ||
          errors[0].message.includes("Forbidden")
        ) {
          errorMessage = `ERROR DE PERMISOS: No se pudo guardar. Verifica resource.ts y API Key.`;
        } else {
          errorMessage += ` Detalle: ${errors[0].message}`;
        }
      }
      if (errors[0]?.message?.includes("not defined for input object type")) {
        errorMessage =
          "El backend aun no tiene los campos respondentName/respondentEmail. Corre 'npx ampx sandbox' o 'amplify push' para alinear el esquema.";
      }
      setLeadError(errorMessage);
      return;
    }

    setFinalOutcome(matchedOutcome);
    setIsSubmitted(true);
  };

  if (loading) return <div className="text-center p-10">Cargando encuesta...</div>;
  if (!survey) return <div className="text-center p-10 text-red-500">Encuesta no encontrada.</div>;
  if (isInactive) return <div className="text-center p-10 text-red-500">Encuesta desactivada.</div>;
  if (questions.length === 0)
    return <div className="text-center p-10 text-red-500">Encuesta sin preguntas.</div>;

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow-xl rounded-lg border my-8">
      <h1 className="text-3xl font-bold mb-2 text-blue-800">{survey.title}</h1>
      <p className="text-gray-600 mb-8 border-b pb-4">{survey.description}</p>

      {isSubmitted ? (
        <div className="text-center p-10 bg-green-50 rounded-lg border-green-300 border-2">
          <h2 className="text-2xl font-bold text-green-700">Tu resultado ha sido calculado</h2>
          <p className="mt-4 text-gray-800">
            Puntaje total:{" "}
            <strong className="text-3xl font-extrabold text-blue-600">
              {Object.values(answers).reduce((sum, a) => sum + (a.score || 0), 0)}
            </strong>{" "}
            puntos.
          </p>

          {finalOutcome ? (
            <div className="mt-6 p-4 bg-white rounded border shadow-md">
              <h3 className="text-2xl font-bold text-blue-900 mb-2">{finalOutcome.title}</h3>
              <p className="mt-2 text-gray-600">{finalOutcome.description}</p>
              {finalOutcome.redirectUrl && (
                <a
                  href={finalOutcome.redirectUrl}
                  target="_blank"
                  className="mt-4 inline-block text-blue-500 hover:underline font-semibold"
                >
                  Ir a la oferta recomendada →
                </a>
              )}
            </div>
          ) : (
            <p className="mt-6 text-yellow-600 font-medium">
              No encontramos un resultado (Outcome) para este puntaje. El administrador debe definir
              los rangos!
            </p>
          )}

          <p className="text-xs mt-6 text-gray-400">Tu respuesta ha sido guardada.</p>
          <p className="text-xs mt-1 text-gray-400">
            Enviaremos el resultado a {leadEmail || "tu correo"}.
          </p>
        </div>
      ) : showEmailGate ? (
        <EmailGate
          onSubmit={handleLeadSubmit}
          loading={savingLead}
          defaultName={leadName}
          defaultEmail={leadEmail}
          onBack={() => setShowEmailGate(false)}
          errorMessage={leadError}
          title={leadConfig.title}
          subtitle={leadConfig.subtitle}
          ctaLabel={leadConfig.ctaLabel}
          disclaimer={leadConfig.disclaimer}
          collectName={leadConfig.collectName}
          requireName={leadConfig.requireName}
          collectEmail={leadConfig.collectEmail}
          requireEmail={leadConfig.requireEmail}
        />
      ) : (
        <div className="space-y-6">
          {/* Indicador de progreso */}
          <div className="text-sm text-gray-600 mb-4 flex items-center justify-between gap-3">
            <span>
              Progreso: {progressValue} / {totalQuestions}
            </span>
            <progress
              className="progress-bar mt-1 flex-1"
              max={totalQuestions || 1}
              value={progressValue}
            />
          </div>

          {questions[currentStep] && (
            <QuestionRenderer
              key={questions[currentStep].id}
              question={questions[currentStep]}
              onAnswer={handleAnswer}
              selectedOptionIds={answers[questions[currentStep].id]?.optionIds || []}
              displayOrder={(questions[currentStep].order || currentStep) + 1}
            />
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={goPrev}
              disabled={currentStep === 0}
              className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition disabled:opacity-50"
            >
              Anterior
            </button>
            <div className="flex flex-1 justify-end gap-3">
              <button
                type="button"
                onClick={goNext}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                {currentStep === totalQuestions - 1 ? "Continuar a email" : "Siguiente"}
              </button>
            </div>
          </div>

          {leadError && <p className="text-sm font-semibold text-red-600">{leadError}</p>}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { client } from "@/utils/amplify-utils";
import type { Schema } from "@/amplify/data/resource";
import QuestionRenderer from "@/components/QuestionRenderer";
import EmailGate from "@/components/EmailGate";
import { Spinner } from "@radix-ui/themes";
import {
  LeadCaptureField,
  LeadCaptureValueMap,
  buildNameFromValues,
  buildLeadCaptureSnapshot,
  createLeadField,
  defaultLeadFields,
  extractEmailFromValues,
  sanitizeLeadFields,
} from "@/utils/leadCapture";

interface AnswerData {
  questionId: string;
  optionIds: string[];
  score: number;
}

const generateRespondentId = () => {
  return typeof window !== "undefined" && window.crypto.randomUUID
    ? window.crypto.randomUUID()
    : `anon-${Date.now()}`;
};

export default function PublicSurveyView() {
  const params = useParams();
  const searchParams = useSearchParams();
  const surveyId = (params?.id as string) || "";
  const previewMode =
    (searchParams?.get("preview") || "").toLowerCase() === "1" ||
    (searchParams?.get("preview") || "").toLowerCase() === "true";

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
  const [leadValues, setLeadValues] = useState<LeadCaptureValueMap>({});

  useEffect(() => {
    if (!surveyId) return;

    client.models.Survey.get({ id: surveyId }).then(({ data: s }) => {
      setSurvey(s);
      setIsInactive(!s?.isActive);
      setLoading(false);
      if (!s?.isActive) return;
    });

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
    if (questions.length === 0) {
      setCurrentStep(0);
      setShowEmailGate(false);
    } else if (currentStep > questions.length - 1) {
      setCurrentStep(questions.length - 1);
    }
  }, [questions, currentStep]);

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

  const calculateOutcome = (totalScore: number): Schema["Outcome"]["type"] | null => {
    if (!outcomes.length) return null;

    const rangedMatch =
      outcomes.find((o) => {
        const min = typeof o.minScore === "number" ? o.minScore : Number.NEGATIVE_INFINITY;
        const max = typeof o.maxScore === "number" ? o.maxScore : Number.POSITIVE_INFINITY;
        return totalScore >= min && totalScore <= max;
      }) || null;

    if (rangedMatch) return rangedMatch;

    // Fallback: closest outcome below or equal the score, or the first one.
    const sorted = [...outcomes].sort(
      (a, b) => (a.minScore ?? Number.NEGATIVE_INFINITY) - (b.minScore ?? Number.NEGATIVE_INFINITY)
    );
    const closestBelow = [...sorted]
      .reverse()
      .find((o) => (o.minScore ?? Number.NEGATIVE_INFINITY) <= totalScore);
    return closestBelow || sorted[0] || null;
  };

  const totalAnswered = useMemo(() => Object.keys(answers).length, [answers]);
  const totalQuestions = questions.length;
  const progressValue = Math.min(totalAnswered, totalQuestions);
  const progressPercent = totalQuestions
    ? Math.round((progressValue / totalQuestions) * 100)
    : 0;

  const leadConfig = useMemo(() => {
    const legacyFields: LeadCaptureField[] = [];
    if (survey?.leadCaptureCollectName ?? true) {
      legacyFields.push(
        createLeadField("first_name", { required: survey?.leadCaptureRequireName ?? false })
      );
    }
    if (survey?.leadCaptureCollectEmail ?? true) {
      legacyFields.push(
        createLeadField("email", { required: survey?.leadCaptureRequireEmail ?? true })
      );
    }
    const parsedFields = sanitizeLeadFields((survey as any)?.leadCaptureFields || legacyFields);

    return {
      title: survey?.leadCaptureTitle || "Ultimo paso: recibe tu resultado por email",
      subtitle:
        survey?.leadCaptureSubtitle ||
        "Comparte tus datos de contacto (al menos uno) para enviarte el resumen del resultado.",
      ctaLabel: survey?.leadCaptureCtaLabel || "Ver resultado",
      disclaimer:
        survey?.leadCaptureDisclaimer ||
        "Guardamos tu resultado y te enviamos el enlace en tu correo.",
      fields: parsedFields.length ? parsedFields : defaultLeadFields(),
    };
  }, [survey]);

  const goNext = () => {
    const currentQuestion = questions[currentStep];
    if (!currentQuestion) return;
    const answered = answers[currentQuestion.id];
    if (!answered && !previewMode) {
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

  const handleLeadSubmit = async ({
    values,
    primaryEmail,
    fullName,
  }: {
    values: LeadCaptureValueMap;
    primaryEmail?: string;
    fullName?: string;
  }) => {
    if (totalAnswered !== totalQuestions) {
      setLeadError("Responde todas las preguntas antes de continuar.");
      setShowEmailGate(false);
      return;
    }
    setLeadError(null);
    setSavingLead(true);
    const capturedName = fullName || buildNameFromValues(leadConfig.fields, values) || "";
    const capturedEmail =
      primaryEmail || extractEmailFromValues(leadConfig.fields, values) || "";
    setLeadName(capturedName);
    setLeadEmail(capturedEmail);
    setLeadValues(values);
    const leadSnapshot = buildLeadCaptureSnapshot(leadConfig.fields, values);

    const totalScore = Object.values(answers).reduce(
      (sum, answer) => sum + (answer.score || 0),
      0
    );
    const matchedOutcome = calculateOutcome(totalScore);

    if (previewMode) {
      setSavingLead(false);
      setFinalOutcome(matchedOutcome);
      setIsSubmitted(true);
      return;
    }

    const submissionPayload = {
      surveyId: surveyId,
      totalScore,
      outcomeTitle: matchedOutcome?.title || "Resultado No Definido",
      answersContent: JSON.stringify(answers),
      respondentId: generateRespondentId(),
      respondentName: capturedName,
      respondentEmail: capturedEmail || undefined,
      leadCaptureData: leadSnapshot,
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
          "El backend aun no tiene los campos respondentName/respondentEmail/leadCaptureData. Corre 'npx ampx sandbox' o 'amplify push' para alinear el esquema.";
      }
      setLeadError(errorMessage);
      return;
    }

    setFinalOutcome(matchedOutcome);
    setIsSubmitted(true);
  };

if (loading)
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
      <Spinner />
    </div>
  );
  if (!survey) return <div className="text-center p-10 text-red-500">Encuesta no encontrada.</div>;
  if (isInactive) return <div className="text-center p-10 text-red-500">Encuesta desactivada.</div>;
  if (questions.length === 0)
    return <div className="text-center p-10 text-red-500">Encuesta sin preguntas.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold ${
                survey.isActive
                  ? "bg-emerald-100/80 text-emerald-800"
                  : "bg-amber-100/80 text-amber-800"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
              {survey.isActive ? "Publicado" : "Borrador"}
            </span>
            {previewMode && (
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1 text-[12px] font-semibold text-slate-200">
                Vista previa
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400">
            Paso {Math.min(currentStep + 1, totalQuestions || 1)} de {totalQuestions || 1}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-900/70 shadow-2xl backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/70 px-6 py-4">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Formulario
              </p>
              <h1 className="text-2xl font-bold text-white">{survey.title}</h1>
              <p className="text-sm text-slate-300 line-clamp-2">
                {survey.description || "Responde el formulario para conocer tu resultado."}
              </p>
            </div>
            <div className="w-full sm:w-64">
              <div className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <span>Progreso</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {isSubmitted ? (
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-50/90 p-6 text-emerald-900 shadow-inner">
                <h2 className="text-2xl font-bold">Tu resultado ha sido calculado</h2>
                <p className="mt-4 text-slate-800">
                  Puntaje total:{" "}
                  <strong className="text-3xl font-extrabold text-emerald-700">
                    {Object.values(answers).reduce((sum, a) => sum + (a.score || 0), 0)}
                  </strong>{" "}
                  puntos.
                </p>

                {finalOutcome ? (
                  <div className="mt-6 rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{finalOutcome.title}</h3>
                    <p className="mt-1 text-sm text-slate-700">{finalOutcome.description}</p>
                    {finalOutcome.redirectUrl && (
                      <a
                        href={finalOutcome.redirectUrl}
                        target="_blank"
                        className="mt-4 inline-block text-sm font-semibold text-emerald-700 hover:underline"
                      >
                        Ir a la oferta recomendada →
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="mt-6 text-sm font-semibold text-amber-700">
                    No encontramos un resultado para este puntaje. El administrador debe definir los rangos.
                  </p>
                )}

                <p className="text-xs mt-6 text-slate-700">
                  {leadEmail
                    ? `Enviaremos el resultado a ${leadEmail}.`
                    : "Guardamos los datos de contacto que compartiste."}
                </p>
              </div>
            ) : showEmailGate ? (
              <EmailGate
                onSubmit={handleLeadSubmit}
                loading={savingLead}
                fields={leadConfig.fields}
                defaultValues={leadValues}
                onBack={() => setShowEmailGate(false)}
                errorMessage={leadError}
                title={leadConfig.title}
                subtitle={leadConfig.subtitle}
                ctaLabel={leadConfig.ctaLabel}
                disclaimer={leadConfig.disclaimer}
                allowSkipValidation={previewMode}
              />
            ) : (
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-md">
                  <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <span>Pregunta {currentStep + 1}</span>
                    <span>
                      {progressValue} / {totalQuestions} respondidas
                    </span>
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
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={goPrev}
                    disabled={currentStep === 0}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <div className="flex flex-1 justify-end gap-3">
                    <button
                      type="button"
                      onClick={goNext}
                      className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                    >
                      {currentStep === totalQuestions - 1 ? "Continuar a contacto" : "Siguiente"}
                    </button>
                  </div>
                </div>

                {leadError && (
                  <p className="text-sm font-semibold text-amber-500">{leadError}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

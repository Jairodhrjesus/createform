"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { signOut } from "aws-amplify/auth";
import { client } from "@/utils/amplify-utils";
import type { Schema } from "@/amplify/data/resource";
import OutcomeManager from "@/components/OutcomeManager";
import Navbar from "@/components/layout/Navbar";
import Modal from "@/components/ui/Modal";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

type QuestionType = Schema["Question"]["type"];
type OptionType = Schema["Option"]["type"];

interface OptionManagerProps {
  questionId: string;
  questionText: string;
}

const OptionManager = ({ questionId, questionText }: OptionManagerProps) => {
  const [options, setOptions] = useState<OptionType[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newText, setNewText] = useState("");
  const [newScore, setNewScore] = useState("0");
  const [savingOption, setSavingOption] = useState(false);
  const [optionToDelete, setOptionToDelete] = useState<OptionType | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const sub = client.models.Option.observeQuery({
      filter: { questionId: { eq: questionId } },
    }).subscribe({
      next: ({ items }) =>
        setOptions(items.slice().sort((a, b) => (a.score || 0) - (b.score || 0))),
    });
    return () => sub.unsubscribe();
  }, [questionId]);

  const addOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    setSavingOption(true);
    const score = parseInt(newScore || "0", 10);

    const { data, errors } = await client.models.Option.create({
      questionId,
      text: newText.trim(),
      score: Number.isNaN(score) ? 0 : score,
    } as unknown as Schema["Option"]["createType"]);

    if (errors) {
      console.error(errors);
    }

    if (data) {
      setOptions((prev) => [...prev, data].sort((a, b) => (a.score || 0) - (b.score || 0)));
      setShowAddModal(false);
      setNewText("");
      setNewScore("0");
    }
    setSavingOption(false);
  };

  const deleteOption = async () => {
    if (!optionToDelete) return;
    setDeleting(true);
    await client.models.Option.delete({ id: optionToDelete.id });
    setOptions((prev) => prev.filter((opt) => opt.id !== optionToDelete.id));
    setDeleting(false);
    setOptionToDelete(null);
  };

  return (
    <div className="mt-3 border border-slate-100 rounded-xl bg-slate-50/70 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Opciones de respuesta
          </p>
          <p className="text-[11px] text-slate-500">Define las opciones y su puntaje.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
        >
          + Añadir opción
        </button>
      </div>
      <ul className="space-y-2">
        {options.map((opt) => (
          <li
            key={opt.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm"
          >
            <div className="flex flex-col">
              <span className="text-sm text-slate-900">{opt.text}</span>
              <span className="text-xs text-slate-500">{opt.score ?? 0} pts</span>
            </div>
            <button
              onClick={() => setOptionToDelete(opt)}
              className="text-xs font-medium text-red-600 hover:text-red-700"
            >
              Eliminar
            </button>
          </li>
        ))}
        {options.length === 0 && (
          <li className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-4 text-sm text-slate-500 text-center">
            Aún no hay opciones para esta pregunta.
          </li>
        )}
      </ul>

      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Añadir opción"
        description={`Pregunta: ${questionText}`}
        footer={
          <>
            <button
              onClick={() => setShowAddModal(false)}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              type="button"
            >
              Cancelar
            </button>
            <button
              onClick={addOption}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
              disabled={!newText.trim() || savingOption}
              type="submit"
            >
              {savingOption ? "Guardando..." : "Guardar opción"}
            </button>
          </>
        }
      >
        <form className="space-y-3" onSubmit={addOption}>
          <div>
            <label className="text-sm font-medium text-slate-700">
              Texto de la opción
            </label>
            <input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder='Ej: "Opción A"'
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">
              Puntaje
            </label>
            <input
              type="number"
              value={newScore}
              onChange={(e) => setNewScore(e.target.value)}
              placeholder="Ej: 10"
              aria-label="Puntaje de la opción"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(optionToDelete)}
        onClose={() => setOptionToDelete(null)}
        title="Eliminar opción"
        description={`Se eliminará "${optionToDelete?.text}" de esta pregunta.`}
        footer={
          <>
            <button
              onClick={() => setOptionToDelete(null)}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              onClick={deleteOption}
              className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
              disabled={deleting}
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </button>
          </>
        }
      />
    </div>
  );
};

export default function SurveyEditor() {
  const params = useParams<{ id?: string }>();
  const surveyId = params?.id ?? "";
  const locale = useLocale();
  const { user } = useAuthenticator();

  const userName =
    user?.signInDetails?.loginId ||
    (user as any)?.attributes?.preferred_username ||
    (user as any)?.attributes?.email ||
    user?.username ||
    (user as any)?.attributes?.name ||
    "";

  const [survey, setSurvey] = useState<Schema["Survey"]["type"] | null>(null);
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [newQText, setNewQText] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirmQuestionId, setConfirmQuestionId] = useState<string | null>(null);
  const [leadTitle, setLeadTitle] = useState("Ultimo paso: recibe tu resultado por email");
  const [leadSubtitle, setLeadSubtitle] = useState(
    "Ingresa tu correo y (opcional) tu nombre para enviarte el resumen del resultado."
  );
  const [leadCta, setLeadCta] = useState("Ver resultado");
  const [leadDisclaimer, setLeadDisclaimer] = useState(
    "Guardamos tu resultado y te enviamos el enlace en tu correo."
  );
  const [collectName, setCollectName] = useState(true);
  const [requireName, setRequireName] = useState(false);
  const [savingLeadConfig, setSavingLeadConfig] = useState(false);
  const [leadMessage, setLeadMessage] = useState<string | null>(null);

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

  useEffect(() => {
    if (!survey) return;
    setLeadTitle(
      survey.leadCaptureTitle || "Ultimo paso: recibe tu resultado por email"
    );
    setLeadSubtitle(
      survey.leadCaptureSubtitle ||
        "Ingresa tu correo y (opcional) tu nombre para enviarte el resumen del resultado."
    );
    setLeadCta(survey.leadCaptureCtaLabel || "Ver resultado");
    setLeadDisclaimer(
      survey.leadCaptureDisclaimer || "Guardamos tu resultado y te enviamos el enlace en tu correo."
    );
    setCollectName(survey.leadCaptureCollectName ?? true);
    setRequireName(survey.leadCaptureRequireName ?? false);
  }, [survey]);

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

  const saveLeadCapture = useCallback(async () => {
    if (!survey) return;
    setSavingLeadConfig(true);
    setLeadMessage(null);
    try {
      const { errors } = await client.models.Survey.update({
        id: surveyId,
        leadCaptureTitle: leadTitle,
        leadCaptureSubtitle: leadSubtitle,
        leadCaptureCtaLabel: leadCta,
        leadCaptureDisclaimer: leadDisclaimer,
        leadCaptureCollectName: collectName,
        leadCaptureRequireName: requireName,
        leadCaptureCollectEmail: true,
        leadCaptureRequireEmail: true,
      } as unknown as Schema["Survey"]["updateType"]);

      if (errors?.length) {
        const messages = errors.map((e) => e.message || "").join("; ");
        console.error("No se pudo guardar lead capture:", errors);
        if (messages.includes("not defined for input object type") || messages.includes("Unknown field")) {
          setLeadMessage(
            "Actualiza el backend para los campos de lead capture (npx ampx sandbox o amplify push && amplify codegen)."
          );
        } else {
          setLeadMessage("No se pudo guardar la configuracion. Detalle: " + messages);
        }
        return;
      }

      setLeadMessage("Configuracion de lead capture guardada para este formulario.");
    } catch (err) {
      console.error("No se pudo guardar lead capture:", err);
      setLeadMessage("Error de red al guardar la configuracion. Intenta de nuevo.");
    } finally {
      setSavingLeadConfig(false);
    }
  }, [
    collectName,
    leadCta,
    leadDisclaimer,
    leadSubtitle,
    leadTitle,
    requireName,
    survey,
    surveyId,
  ]);

  const deleteQuestion = async () => {
    if (!confirmQuestionId) return;
    await client.models.Question.delete({ id: confirmQuestionId });
    setQuestions((prev) => prev.filter((q) => q.id !== confirmQuestionId));
    setConfirmQuestionId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-700 flex items-center justify-center">
        Cargando editor...
      </div>
    );
  }
  if (!survey) {
    return (
      <div className="min-h-screen bg-slate-50 text-red-600 flex items-center justify-center">
        Encuesta no encontrada.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <Navbar userName={userName} onSignOut={async () => signOut()} />

      <div className="mx-auto flex w-full flex-col gap-6 px-4 pb-12 pt-6 lg:px-6">
        <div className="flex items-center justify-between">
          <div>
            <Breadcrumbs
              items={[
                { label: "Dashboard", href: `/${locale}` },
                { label: survey.title || "Encuesta" },
              ]}
            />
            <h1 className="mt-2 text-3xl font-bold text-slate-900">{survey.title}</h1>
            <p className="text-sm text-slate-500">{survey.description}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm text-sm text-slate-700">
            <p className="font-semibold">ID encuesta</p>
            <p className="font-mono text-xs text-slate-500">{survey.id}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <section className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Estructura
                  </p>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Preguntas ({questions.length})
                  </h2>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newQText}
                    onChange={(e) => setNewQText(e.target.value)}
                    placeholder="Escribe una nueva pregunta..."
                    className="w-64 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-slate-900/80"
                  />
                  <button
                    onClick={addQuestion}
                    disabled={!newQText.trim()}
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    Añadir
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {questions.map((q, index) => (
                <div
                  key={q.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Pregunta #{index + 1}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-900">{q.text}</h3>
                      <p className="text-xs text-slate-500">ID: {q.id}</p>
                    </div>
                    <button
                      onClick={() => setConfirmQuestionId(q.id)}
                      className="rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                    >
                      Eliminar
                    </button>
                  </div>
                  <OptionManager questionId={q.id} questionText={q.text} />
                </div>
              ))}

              {questions.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
                  <p className="text-sm font-semibold text-slate-800">
                    Aún no hay preguntas
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Añade tu primera pregunta para diseñar el cuestionario.
                  </p>
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Resultados y rangos
                  </p>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Reglas de Outcome
                  </h3>
                  <p className="text-sm text-slate-600">
                    Mapea puntajes a un resultado para mostrar recomendaciones.
                  </p>
                </div>
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 text-sm font-semibold"
                  title="Define tramos de puntaje (mínimo y máximo) y el Outcome que verá el usuario al finalizar la encuesta."
                  aria-label="Ayuda sobre outcomes"
                >
                  ?
                </div>
              </div>
              <div className="mt-4">
                <OutcomeManager surveyId={surveyId} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Lead capture
                  </p>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Personaliza la puerta de email
                  </h3>
                  <p className="text-sm text-slate-600">
                    Define el copy y los campos que solicitas antes de mostrar el resultado.
                  </p>
                  <p className="text-xs text-slate-500">
                    Esta configuracion se guarda solo en esta encuesta.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-sm font-semibold text-slate-800">Titulo</label>
                  <input
                    value={leadTitle}
                    onChange={(e) => setLeadTitle(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-800">Subtitulo</label>
                  <textarea
                    value={leadSubtitle}
                    onChange={(e) => setLeadSubtitle(e.target.value)}
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-slate-800">CTA</label>
                    <input
                      value={leadCta}
                      onChange={(e) => setLeadCta(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-800">Disclaimer</label>
                    <input
                      value={leadDisclaimer}
                      onChange={(e) => setLeadDisclaimer(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm text-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Campos a solicitar</p>
                      <p className="text-xs text-slate-500">
                        Email es obligatorio; puedes decidir si pides nombre y si es requerido.
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                      Email siempre requerido
                    </span>
                  </div>
                  <div className="mt-3 flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-sm text-slate-800">
                      <input
                        type="checkbox"
                        checked={collectName}
                        onChange={(e) => setCollectName(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                      />
                      Solicitar nombre
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-800 pl-6">
                      <input
                        type="checkbox"
                        checked={requireName}
                        onChange={(e) => setRequireName(e.target.checked)}
                        disabled={!collectName}
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400 disabled:opacity-50"
                      />
                      Hacer nombre obligatorio
                    </label>
                  </div>
                </div>

                {leadMessage && (
                  <p className="text-xs font-semibold text-emerald-700">{leadMessage}</p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLeadTitle("Ultimo paso: recibe tu resultado por email");
                      setLeadSubtitle(
                        "Ingresa tu correo y (opcional) tu nombre para enviarte el resumen del resultado."
                      );
                      setLeadCta("Ver resultado");
                      setLeadDisclaimer(
                        "Guardamos tu resultado y te enviamos el enlace en tu correo."
                      );
                      setCollectName(true);
                      setRequireName(false);
                      setLeadMessage(null);
                    }}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Restaurar copy
                  </button>
                  <button
                    type="button"
                    onClick={saveLeadCapture}
                    disabled={savingLeadConfig}
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
                  >
                    {savingLeadConfig ? "Guardando..." : "Guardar configuracion"}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-900 text-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                Estado
              </p>
              <h3 className="mt-2 text-lg font-semibold">
                {questions.length} pregunta{questions.length === 1 ? "" : "s"}
              </h3>
              <p className="mt-1 text-sm text-white/80">
                Agrega opciones y outcomes para publicar tu encuesta.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-white/10 px-3 py-1">
                  ID: {survey.id?.slice(0, 8)}...
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Modal
        open={Boolean(confirmQuestionId)}
        onClose={() => setConfirmQuestionId(null)}
        title="Eliminar pregunta"
        description="Esto eliminará la pregunta y todas sus opciones asociadas."
        footer={
          <>
            <button
              onClick={() => setConfirmQuestionId(null)}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              onClick={deleteQuestion}
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

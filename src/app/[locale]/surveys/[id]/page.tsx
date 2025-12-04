"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { client } from "@/utils/amplify-utils";
import { EditorTopbar } from "@/components/surveys/editor/EditorTopbar";
import { QuestionRail } from "@/components/surveys/editor/QuestionRail";
import { QuestionCanvas } from "@/components/surveys/editor/QuestionCanvas";
import { InspectorPanel } from "@/components/surveys/editor/InspectorPanel";
import { ContentToolbar } from "@/components/surveys/editor/ContentToolbar";
import { useSurveyEditorData } from "@/hooks/useSurveyEditorData";
import { useQuestionOptions } from "@/hooks/useQuestionOptions";
import { useQuestionInspector } from "@/hooks/useQuestionInspector";
import { useOutcomes } from "@/hooks/useOutcomes";
import { Spinner } from "@radix-ui/themes";

export default function SurveyEditorPage() {
  const params = useParams<{ id?: string }>();
  const surveyId = params?.id ?? "";
  const locale = useLocale();
  const { user } = useAuthenticator();

  const [selectedEndingId, setSelectedEndingId] = useState<string | null>(null);
  const {
    survey,
    questions,
    loading,
    selectedQuestion,
    selectQuestion,
    addQuestion,
    deleteQuestion,
    updateQuestionText,
    updateQuestionType,
    reorderQuestion,
  } = useSurveyEditorData(surveyId, { autoSelect: !selectedEndingId });
  const {
    options,
    loading: optionsLoading,
    addOption,
    deleteOption,
    updateOption,
    reorderOptions,
  } = useQuestionOptions(selectedQuestion?.id ?? null, selectedQuestion?.type ?? undefined, true);
  const { required, toggleRequired } = useQuestionInspector(selectedQuestion);
  const {
    outcomes,
    addOutcome,
    updateOutcome,
    deleteOutcome,
  } = useOutcomes(surveyId);

  const [endingOrder, setEndingOrder] = useState<string[]>([]);

  const orderedEndings = useMemo(() => {
    if (!outcomes.length) return [];
    if (!endingOrder.length) return outcomes;
    const map = new Map(outcomes.map((o) => [o.id as string, o]));
    const ordered = endingOrder
      .map((id) => map.get(id))
      .filter(Boolean) as typeof outcomes;
    const remaining = outcomes.filter((o) => !endingOrder.includes(o.id as string));
    return [...ordered, ...remaining];
  }, [outcomes, endingOrder]);

  useEffect(() => {
    if (!outcomes.length) return;
    setEndingOrder((prev) => {
      const existing = new Set(prev);
      const next = [...prev];
      outcomes.forEach((o) => {
        if (!existing.has(o.id as string)) next.push(o.id as string);
      });
      return next;
    });
  }, [outcomes]);

  const leadCaptureEnding = useMemo(() => {
    if (!survey) return null;
    return {
      id: "lead-capture",
      title: survey.leadCaptureTitle || "Lead capture",
      description:
        survey.leadCaptureSubtitle ||
        "Solicita el email (y opcionalmente el nombre) antes de mostrar el resultado.",
      type: "lead_capture" as const,
      minScore: 0,
      maxScore: 0,
    };
  }, [
    survey,
    survey?.leadCaptureTitle,
    survey?.leadCaptureSubtitle,
    survey?.leadCaptureCollectName,
    survey?.leadCaptureRequireName,
  ]);

  const endingItems = useMemo(() => {
    const mapped = orderedEndings.map((o) => ({
      ...o,
      type: o.redirectUrl ? "redirect_url" : ("final_screen" as const),
    }));
    return leadCaptureEnding ? [leadCaptureEnding, ...mapped] : mapped;
  }, [leadCaptureEnding, orderedEndings]);

  const selectedEnding = selectedEndingId
    ? (endingItems.find((o) => o.id === selectedEndingId) as any)
    : null;

  const userName =
    user?.signInDetails?.loginId ||
    (user as any)?.attributes?.preferred_username ||
    (user as any)?.attributes?.email ||
    user?.username ||
    (user as any)?.attributes?.name ||
    "";

  const breadcrumbs = useMemo(
    () => [
      { label: "Dashboard", href: `/${locale}` },
      { label: "Surveys", href: `/${locale}/surveys` },
      { label: survey?.title || "Survey" },
    ],
    [locale, survey?.title]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        <Spinner size="2" />
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-red-600">
        Survey not found.
      </div>
    );
  }

  const handleAddQuestion = async () => {
    await addQuestion("Your question here");
  };

  const handleUpdateQuestionText = (text: string, persist?: boolean) => {
    if (!selectedQuestion?.id) return;
    updateQuestionText(selectedQuestion.id, text, persist);
  };

  const handleAddEnding = async (type: "final_screen" | "redirect_url") => {
    const defaults =
      type === "redirect_url"
        ? {
            title: "Redirect to URL",
            description: "Lleva al usuario a un link.",
            redirectUrl: "https://",
          }
        : {
            title: "End Screen",
            description: "Pantalla final con CTA.",
          };
    const newOutcome = await addOutcome({
      ...defaults,
      minScore: 0,
      maxScore: 0,
    } as any);
    if (newOutcome?.id) setSelectedEndingId(newOutcome.id as string);
  };

  const handleSelectEnding = (id: string) => {
    setSelectedEndingId(id);
    selectQuestion(""); // deseleccionar pregunta
  };

  const handleSelectQuestion = (id: string) => {
    setSelectedEndingId(null);
    selectQuestion(id);
  };

  const handleDeleteEnding = async (id: string) => {
    if (id === "lead-capture") return;
    await deleteOutcome(id);
    if (selectedEndingId === id) setSelectedEndingId(null);
  };

  const handleReorderEndings = (ids: string[]) => {
    setEndingOrder(ids.filter((id) => id !== "lead-capture"));
  };

  const handleDuplicateEnding = async (id: string) => {
    if (id === "lead-capture") return;
    const source = outcomes.find((o) => o.id === id);
    if (!source) return;
    const newOutcome = await addOutcome({
      title: source.title ? `${source.title} (copy)` : "Ending copy",
      description: source.description,
      minScore: source.minScore ?? 0,
      maxScore: source.maxScore ?? 0,
      redirectUrl: source.redirectUrl,
    } as any);
    if (newOutcome?.id) {
      setSelectedEndingId(newOutcome.id as string);
      setEndingOrder((prev) => [...prev.filter((e) => e !== "lead-capture"), newOutcome.id as string]);
    }
  };

  const handleDuplicateQuestion = async (id: string) => {
    const sourceQuestion = questions.find((q) => q.id === id);
    if (!sourceQuestion) return;
    const newQuestion = await addQuestion(
      sourceQuestion.text || "Untitled",
      sourceQuestion.type || undefined
    );
    if (!newQuestion?.id) return;

    // Duplicar opciones del origen
    try {
      const { data: sourceOptions } = await client.models.Option.list({
        filter: { questionId: { eq: id } },
      } as any);
      if (Array.isArray(sourceOptions)) {
        await Promise.all(
          sourceOptions.map((opt: any) =>
            client.models.Option.create({
              questionId: newQuestion.id as string,
              text: opt.text,
              score: opt.score,
            } as any)
          )
        );
      }
      selectQuestion(newQuestion.id as string);
    } catch (err) {
      console.error("No se pudo duplicar opciones:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <EditorTopbar
        breadcrumbs={breadcrumbs}
        title={survey.title || "Untitled survey"}
        surveyId={survey.id}
        userName={userName}
      />

      <main className="mx-auto px-4 pb-12 pt-6 lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ContentToolbar onAddQuestion={handleAddQuestion} />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[280px,1fr,320px]">
          <QuestionRail
            questions={questions}
            selectedId={selectedQuestion?.id || null}
            onSelect={handleSelectQuestion}
            onAdd={handleAddQuestion}
            onDelete={deleteQuestion}
            onDuplicate={handleDuplicateQuestion}
            onReorder={reorderQuestion}
            endings={endingItems as any}
            selectedEndingId={selectedEndingId}
            onSelectEnding={handleSelectEnding}
            onAddEnding={handleAddEnding}
            onDeleteEnding={handleDeleteEnding}
            onDuplicateEnding={handleDuplicateEnding}
            onReorderEnding={handleReorderEndings}
          />
          <QuestionCanvas
            question={selectedQuestion}
            ending={selectedEnding as any}
            survey={survey}
            surveyId={surveyId}
            options={options}
            optionsLoading={optionsLoading}
            onChangeText={handleUpdateQuestionText}
            onAddOption={addOption}
            onDeleteOption={deleteOption}
            onUpdateOption={updateOption}
            onReorderOption={reorderOptions}
            onDeleteQuestion={deleteQuestion}
            onUpdateEnding={(updates) => {
              if (selectedEnding?.id === "lead-capture") {
                // Lead capture se guarda dentro de Survey; el panel maneja el guardado.
                return;
              }
              if (selectedEnding?.id) {
                updateOutcome(selectedEnding.id as string, updates as any);
              }
            }}
            onDeleteEnding={() => selectedEnding?.id && handleDeleteEnding(selectedEnding.id)}
          />
          <InspectorPanel
            question={selectedQuestion}
            onChangeType={(type) => {
              if (selectedQuestion?.id) updateQuestionType(selectedQuestion.id, type);
            }}
            required={required}
            onToggleRequired={toggleRequired}
          />
        </div>
      </main>
    </div>
  );
}





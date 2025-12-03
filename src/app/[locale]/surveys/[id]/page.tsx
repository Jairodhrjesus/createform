"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuthenticator } from "@aws-amplify/ui-react";
import EmailGate from "@/components/EmailGate";
import OutcomeManager from "@/components/OutcomeManager";
import LeadCapturePanel from "@/components/surveys/editor/LeadCapturePanel";
import { EditorTopbar } from "@/components/surveys/editor/EditorTopbar";
import { EditorTabs } from "@/components/surveys/editor/EditorTabs";
import { QuestionRail } from "@/components/surveys/editor/QuestionRail";
import { QuestionCanvas } from "@/components/surveys/editor/QuestionCanvas";
import { InspectorPanel } from "@/components/surveys/editor/InspectorPanel";
import { ContentToolbar } from "@/components/surveys/editor/ContentToolbar";
import { useEditorTabs } from "@/hooks/useEditorTabs";
import { useSurveyEditorData } from "@/hooks/useSurveyEditorData";
import { useQuestionOptions } from "@/hooks/useQuestionOptions";
import { useQuestionInspector } from "@/hooks/useQuestionInspector";

export default function SurveyEditorPage() {
  const params = useParams<{ id?: string }>();
  const surveyId = params?.id ?? "";
  const locale = useLocale();
  const { user } = useAuthenticator();

  const { activeTab, setActiveTab } = useEditorTabs();
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
  } = useSurveyEditorData(surveyId);
  const {
    options,
    loading: optionsLoading,
    addOption,
    deleteOption,
    updateOption,
  } = useQuestionOptions(selectedQuestion?.id || null, selectedQuestion?.type, true);
  const { required, toggleRequired } = useQuestionInspector(selectedQuestion);

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
        Loading editor...
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

  const handleUpdateQuestionText = (text: string) => {
    if (!selectedQuestion?.id) return;
    updateQuestionText(selectedQuestion.id, text);
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
          <EditorTabs activeTab={activeTab} onChange={setActiveTab} />
          {activeTab === "content" ? (
            <ContentToolbar onAddQuestion={handleAddQuestion} />
          ) : null}
        </div>

        {activeTab === "content" ? (
          <div className="mt-5 grid gap-5 lg:grid-cols-[280px,1fr,320px]">
            <QuestionRail
              questions={questions}
              selectedId={selectedQuestion?.id || null}
              onSelect={selectQuestion}
              onAdd={handleAddQuestion}
              onDelete={deleteQuestion}
              onReorder={reorderQuestion}
            />
            <QuestionCanvas
              question={selectedQuestion}
              options={options}
              optionsLoading={optionsLoading}
              onChangeText={handleUpdateQuestionText}
              onAddOption={addOption}
              onDeleteOption={deleteOption}
              onUpdateOption={updateOption}
              onDeleteQuestion={deleteQuestion}
            />
            <InspectorPanel
              question={selectedQuestion}
              onDelete={deleteQuestion}
              onChangeType={(type) => {
                if (selectedQuestion?.id) updateQuestionType(selectedQuestion.id, type);
              }}
              required={required}
              onToggleRequired={toggleRequired}
            />
          </div>
        ) : null}

        {activeTab === "workflow" ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Resultados y rangos
                  </p>
                  <h3 className="text-xl font-semibold text-slate-900">Reglas de Outcome</h3>
                  <p className="text-sm text-slate-600">
                    Mapea puntajes a un resultado para mostrar recomendaciones.
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 text-sm font-semibold">
                  ?
                </div>
              </div>
            </div>
            <OutcomeManager surveyId={surveyId} />
          </div>
        ) : null}

        {activeTab === "connect" ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr,0.7fr]">
            <LeadCapturePanel survey={survey} surveyId={surveyId} />
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Vista previa de Email Gate
              </p>
              <p className="text-sm text-slate-600">
                Asi se verá el formulario de lead capture para este quiz.
              </p>
              <div className="mt-4">
                <EmailGate
                  onSubmit={async () => Promise.resolve()}
                  title={survey.leadCaptureTitle || undefined}
                  subtitle={survey.leadCaptureSubtitle || undefined}
                  ctaLabel={survey.leadCaptureCtaLabel || undefined}
                  disclaimer={survey.leadCaptureDisclaimer || undefined}
                  collectName={survey.leadCaptureCollectName ?? true}
                  requireName={survey.leadCaptureRequireName ?? false}
                  collectEmail
                  requireEmail
                />
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

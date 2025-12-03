import Link from "next/link";
import { useTranslations } from "next-intl";
import { SurveyActionsMenu } from "./SurveyActionsMenu";
import type { SurveyListItem } from "./hooks/useSurveys";

import type { Schema } from "@/amplify/data/resource";

type SurveyType = SurveyListItem;
type WorkspaceType = Schema["Workspace"]["type"];

type Props = {
  surveys: SurveyType[];
  workspaces: WorkspaceType[];
  workspaceSurveyCounts: Record<string, number>;
  locale: string;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  formatUpdatedAt: (value?: string | number | Date | null) => string;
  getUpdatedValue: (survey: SurveyType) => string | number | Date | null;
  onShare: (id: string) => void;
  onCopyId: (id: string) => void;
  onToggleActive: (survey: SurveyType) => void;
  onDuplicate: (survey: SurveyType) => void;
  onMove: (surveyId: string, workspaceId: string) => void;
  onDelete: (id: string) => void;
};

export function SurveyGridView({
  surveys,
  workspaces,
  workspaceSurveyCounts,
  locale,
  openMenuId,
  setOpenMenuId,
  formatUpdatedAt,
  getUpdatedValue,
  onShare,
  onCopyId,
  onToggleActive,
  onDuplicate,
  onMove,
  onDelete,
}: Props) {
  const t = useTranslations("Dashboard");

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {surveys.map((survey) => (
          <div
            key={survey.id}
            className="relative flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5 text-sm font-semibold text-slate-700">
                {survey.title?.charAt(0).toUpperCase() || "F"}
              </span>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/${locale}/surveys/${survey.id}`}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {survey.title || t("untitledSurvey")}
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === survey.id ? null : (survey.id as string));
                    }}
                    className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    ...
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                  {workspaces.find((w) => w.id === survey.workspaceId)?.name || t("unassigned")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${
                  survey.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-500"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {survey.isActive ? t("status.active") : t("status.draft")}
              </span>
              <span className="text-[11px] font-semibold">{survey.submissionCount ?? 0} respuestas</span>
              <span className="text-[11px]">
                {t("card.updated", { date: formatUpdatedAt(getUpdatedValue(survey)) })}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => onShare(survey.id as string)}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
              >
                {t("actions.share")}
              </button>
              <div className="flex items-center gap-2">
                <Link
                  href={`/${locale}/submissions/${survey.id}`}
                  className="text-[11px] font-medium text-slate-700 hover:underline"
                >
                  {t("actions.viewResults")}
                </Link>
                <Link
                  href={`/${locale}/surveys/${survey.id}`}
                  className="text-[11px] font-medium text-slate-700 hover:underline"
                >
                  {t("card.open")}
                </Link>
              </div>
            </div>

            <SurveyActionsMenu
              surveyId={survey.id as string}
              openMenuId={openMenuId}
              setOpenMenuId={setOpenMenuId}
              locale={locale}
              workspaces={workspaces}
              workspaceSurveyCounts={workspaceSurveyCounts}
              isActive={!!survey.isActive}
              onShare={onShare}
              onCopyId={onCopyId}
              onToggleActive={() => onToggleActive(survey)}
              onDuplicate={() => onDuplicate(survey)}
              onMove={(workspaceId) => onMove(survey.id as string, workspaceId)}
              onDelete={() => onDelete(survey.id as string)}
              align="right"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

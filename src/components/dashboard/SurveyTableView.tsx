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

export function SurveyTableView({
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
    <div className="flex-1 overflow-x-auto overflow-y-auto">
      <table className="min-w-full border-separate border-spacing-y-1 px-4 py-4 sm:px-6">
        <thead>
          <tr className="text-left text-xs text-slate-500">
            <th className="px-3 py-2 font-medium">{t("table.name")}</th>
            <th className="px-3 py-2 font-medium">{t("table.responses")}</th>
            <th className="px-3 py-2 font-medium">{t("table.status")}</th>
            <th className="px-3 py-2 font-medium">{t("table.updated")}</th>
            <th className="px-3 py-2 font-medium text-right">{t("table.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {surveys.map((survey) => (
            <tr key={survey.id} className="align-middle text-sm text-slate-800">
              <td className="px-3 py-2">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900/5 text-xs font-semibold text-slate-700">
                    {survey.title?.charAt(0).toUpperCase() || "F"}
                  </span>
                  <div>
                    <Link
                      href={`/${locale}/surveys/${survey.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {survey.title || t("untitledSurvey")}
                    </Link>
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5">
                        {workspaces.find((w) => w.id === survey.workspaceId)?.name ||
                          t("unassigned")}
                      </span>
                      <button
                        onClick={() => onShare(survey.id as string)}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 font-medium text-slate-700 hover:bg-slate-50"
                      >
                        {t("actions.share")}
                      </button>
                    </div>
                  </div>
                </div>
              </td>

              <td className="px-3 py-2 text-center text-sm font-semibold text-slate-700">
                {survey.submissionCount ?? 0}
              </td>

              <td className="px-3 py-2 text-xs">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${
                    survey.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-500"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {survey.isActive ? t("status.active") : t("status.draft")}
                </span>
              </td>

              <td className="px-3 py-2 text-xs text-slate-500">
                {formatUpdatedAt(getUpdatedValue(survey))}
              </td>

              <td className="relative px-3 py-2 text-xs">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/${locale}/surveys/${survey.id}`}
                    className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {t("actions.edit")}
                  </Link>
                  <Link
                    href={`/${locale}/submissions/${survey.id}`}
                    className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {t("actions.viewResults")}
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === survey.id ? null : (survey.id as string));
                    }}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                  >
                    ...
                  </button>
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

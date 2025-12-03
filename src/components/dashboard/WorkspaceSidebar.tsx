import type { ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import type { Schema } from "@/amplify/data/resource";

type WorkspaceType = Schema["Workspace"]["type"];
export type WorkspaceFilter = string | "all" | "unassigned";

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  hasWorkspaceModel: boolean;
  workspaces: WorkspaceType[];
  workspaceSurveyCounts: Record<string, number>;
  activeWorkspaceId: WorkspaceFilter;
  onWorkspaceChange: (id: WorkspaceFilter) => void;
  hasUnassigned: boolean;
  onCreateWorkspace: () => void;
  filteredSurveysCount: number;
  totalSurveys: number;
};

export function WorkspaceSidebar({
  search,
  onSearchChange,
  hasWorkspaceModel,
  workspaces,
  workspaceSurveyCounts,
  activeWorkspaceId,
  onWorkspaceChange,
  hasUnassigned,
  onCreateWorkspace,
  filteredSurveysCount,
  totalSurveys,
}: Props) {
  const t = useTranslations("Dashboard");

  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  };

  return (
    <aside className="flex h-full min-h-0 flex-col gap-4 rounded-2xl border border-slate-200 bg-white/70 p-4 backdrop-blur-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {t("searchLabel")}
        </p>
        <div className="relative mt-2">
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-slate-900/80"
          />
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("workspaces")}
          </p>
          {hasWorkspaceModel && (
            <button
              onClick={onCreateWorkspace}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
              title={t("createWorkspace")}
            >
              +
            </button>
          )}
        </div>
        <div className="mt-1 flex flex-col gap-1 text-sm">
          {hasWorkspaceModel ? (
            <>
              <button
                onClick={() => onWorkspaceChange("all")}
                className={`flex items-center justify-between rounded-xl border px-3 py-2 transition ${
                  activeWorkspaceId === "all"
                    ? "border-slate-900/10 bg-slate-900 text-white"
                    : "border-slate-900/10 bg-white text-slate-900 hover:bg-slate-50"
                }`}
              >
                <span className="truncate">{t("allWorkspaces")}</span>
                <span className="rounded-full bg-white/10 px-2 text-xs">{totalSurveys}</span>
              </button>
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => onWorkspaceChange(ws.id as string)}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 transition ${
                    activeWorkspaceId === ws.id
                      ? "border-slate-900/10 bg-slate-900 text-white"
                      : "border-slate-900/10 bg-white text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <span className="truncate">
                    {ws.name || t("untitledWorkspace")}
                    {ws.isDefault ? ` (${t("defaultWorkspace")})` : ""}
                  </span>
                  <span className="rounded-full bg-white/10 px-2 text-xs">
                    {workspaceSurveyCounts[ws.id as string] ?? 0}
                  </span>
                </button>
              ))}
              {hasUnassigned && (
                <button
                  onClick={() => onWorkspaceChange("unassigned")}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 transition ${
                    activeWorkspaceId === "unassigned"
                      ? "border-slate-900/10 bg-slate-900 text-white"
                      : "border-slate-900/10 bg-white text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <span className="truncate">{t("unassigned")}</span>
                  <span className="rounded-full bg-white/10 px-2 text-xs">
                    {workspaceSurveyCounts["unassigned"] ?? 0}
                  </span>
                </button>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500">{t("workspacesUnavailable")}</p>
          )}
        </div>
      </div>

      <div className="mt-auto rounded-xl bg-slate-900/5 px-3 py-3 text-xs text-slate-500">
        <p className="mb-1 font-medium text-slate-700">{t("summaryTitle")}</p>
        <p>
          {t("summaryVisible")}{" "}
          <span className="font-semibold text-slate-900">{filteredSurveysCount}</span>
        </p>
      </div>
    </aside>
  );
}

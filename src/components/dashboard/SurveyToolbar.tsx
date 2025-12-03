import { useTranslations } from "next-intl";

type Props = {
  activeWorkspaceName: string;
  filteredCount: number;
  viewMode: "list" | "grid";
  onChangeView: (view: "list" | "grid") => void;
  sortKey: "updatedAt" | "createdAt" | "title";
  onChangeSort: (key: "updatedAt" | "createdAt" | "title") => void;
};

export function SurveyToolbar({
  activeWorkspaceName,
  filteredCount,
  viewMode,
  onChangeView,
  sortKey,
  onChangeSort,
}: Props) {
  const t = useTranslations("Dashboard");

  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:px-6">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
          F
        </span>
        <div>
          <p className="text-sm font-medium text-slate-900">
            {t("toolbar.formsIn", { workspace: activeWorkspaceName })}
          </p>
          <p className="text-xs text-slate-500">
            {t("toolbar.results", { count: filteredCount })}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
          <span className="text-[11px] text-slate-500">{t("toolbar.sortLabel")}:</span>
          <select
            value={sortKey}
            onChange={(e) => onChangeSort(e.target.value as "updatedAt" | "createdAt" | "title")}
            className="bg-transparent text-[11px] font-medium text-slate-700 focus:outline-none"
          >
            <option value="updatedAt">{t("toolbar.sortUpdated")}</option>
            <option value="createdAt">{t("toolbar.sortCreated")}</option>
            <option value="title">{t("toolbar.sortAlpha")}</option>
          </select>
        </div>
        <div className="flex rounded-full border border-slate-200 bg-slate-50 p-1">
          <button
            onClick={() => onChangeView("list")}
            className={`rounded-full px-2 py-1 text-[11px] font-medium ${
              viewMode === "list" ? "bg-white text-slate-800 shadow" : "text-slate-400"
            }`}
          >
            {t("view.list")}
          </button>
          <button
            onClick={() => onChangeView("grid")}
            className={`rounded-full px-2 py-1 text-[11px] font-medium ${
              viewMode === "grid" ? "bg-white text-slate-800 shadow" : "text-slate-400"
            }`}
          >
            {t("view.grid")}
          </button>
        </div>
      </div>
    </div>
  );
}

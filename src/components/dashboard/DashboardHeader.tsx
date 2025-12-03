import { useTranslations } from "next-intl";

type Props = {
  activeWorkspaceName: string;
  onCreateSurvey: () => void;
};

export function DashboardHeader({ activeWorkspaceName, onCreateSurvey }: Props) {
  const t = useTranslations("Dashboard");

  return (
    <header className="mb-4 flex flex-col gap-4 sm:mb-6 sm:h-[10vh] sm:min-h-[84px] sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          {t("workspaceTag")}
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">{t("title")}</h1>
        <p className="text-sm text-slate-500">
          {t("subtitle", { workspace: activeWorkspaceName })}
        </p>
      </div>

      <button
        onClick={onCreateSurvey}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 sm:w-auto"
      >
        <span className="text-lg leading-none">+</span>
        {t("createSurvey")}
      </button>
    </header>
  );
}

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Schema } from "@/amplify/data/resource";

type WorkspaceType = Schema["Workspace"]["type"];

type Props = {
  surveyId: string;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  locale: string;
  workspaces: WorkspaceType[];
  workspaceSurveyCounts: Record<string, number>;
  isActive: boolean;
  onShare: (id: string) => void;
  onCopyId: (id: string) => void;
  onToggleActive: () => void;
  onDuplicate: () => void;
  onMove: (workspaceId: string) => void;
  onDelete: () => void;
  align?: "left" | "right";
};

export function SurveyActionsMenu({
  surveyId,
  openMenuId,
  setOpenMenuId,
  locale,
  workspaces,
  workspaceSurveyCounts,
  isActive,
  onShare,
  onCopyId,
  onToggleActive,
  onDuplicate,
  onMove,
  onDelete,
  align = "right",
}: Props) {
  const t = useTranslations("Dashboard");

  if (openMenuId !== surveyId) return null;

  return (
    <div
      className={`absolute ${align === "right" ? "right-0" : "left-0"} z-20 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => onShare(surveyId)}
        className="flex w-full items-center px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
      >
        {t("actions.copyLink")}
      </button>
      <button
        onClick={() => onCopyId(surveyId)}
        className="flex w-full items-center px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
      >
        {t("actions.copyId")}
      </button>
      <button
        onClick={onToggleActive}
        className="flex w-full items-center px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
      >
        {isActive ? t("actions.deactivate") : t("actions.publish")}
      </button>
      <button
        onClick={onDuplicate}
        className="flex w-full items-center px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
      >
        {t("actions.duplicate")}
      </button>
      <Link
        href={`/${locale}/surveys/${surveyId}`}
        className="flex w-full items-center px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
      >
        {t("actions.edit")}
      </Link>
      <div className="border-t border-slate-100">
        <p className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          {t("actions.moveTo")}
        </p>
        <div className="max-h-32 overflow-y-auto py-1">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => onMove(ws.id as string)}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
            >
              <span className="truncate">{ws.name || t("untitledWorkspace")}</span>
              <span className="text-[10px] text-slate-400">
                {workspaceSurveyCounts[ws.id as string] ?? 0} f.
              </span>
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={onDelete}
        className="flex w-full items-center px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50"
      >
        {t("actions.delete")}
      </button>
    </div>
  );
}

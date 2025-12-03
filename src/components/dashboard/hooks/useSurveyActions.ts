import { useCallback } from "react";
import { client } from "@/utils/amplify-utils";
import type { WorkspaceFilter } from "../WorkspaceSidebar";
import type { SurveyListItem } from "./useSurveys";

type Params = {
  locale: string;
  t: (key: string, values?: Record<string, unknown>) => string;
  hasWorkspaceModel: boolean;
  resolveWorkspaceId: (fallback?: string | null) => string | null;
  activeWorkspaceId: WorkspaceFilter;
  setActiveWorkspaceId: (id: WorkspaceFilter) => void;
  setOpenMenuId: (id: string | null) => void;
  updateSurveyLocally?: (id: string, patch: Partial<SurveyListItem>) => void;
};

// Handlers de acciones sobre encuestas (duplicar, mover, compartir, borrar, etc.)
export function useSurveyActions({
  locale,
  t,
  hasWorkspaceModel,
  resolveWorkspaceId,
  activeWorkspaceId,
  setActiveWorkspaceId,
  setOpenMenuId,
  updateSurveyLocally,
}: Params) {
  const copyToClipboard = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
      } catch (err) {
        console.error("No se pudo copiar:", err);
        window.prompt(t("actions.manualCopy"), text);
      }
    },
    [t]
  );

  const handleShare = useCallback(
    (surveyId: string) => {
      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL || "";
      const link = `${origin}/${locale}/embed/${surveyId}`;
      copyToClipboard(link);
      setOpenMenuId(null);
    },
    [locale, copyToClipboard, setOpenMenuId]
  );

  const handleCopyId = useCallback(
    (surveyId: string) => {
      copyToClipboard(surveyId);
      setOpenMenuId(null);
    },
    [copyToClipboard, setOpenMenuId]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!window.confirm(t("actions.confirmDelete"))) return;
      await client.models.Survey.delete({ id });
      setOpenMenuId(null);
    },
    [t, setOpenMenuId]
  );

  const handleToggleActive = useCallback(
    async (survey: SurveyListItem) => {
      try {
        await client.models.Survey.update({
          id: survey.id as string,
          isActive: !survey.isActive,
        } as any);
        if (updateSurveyLocally) {
          updateSurveyLocally(survey.id as string, {
            isActive: !survey.isActive,
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error("No se pudo cambiar el estado:", err);
        alert(t("errors.toggleActive"));
      } finally {
        setOpenMenuId(null);
      }
    },
    [t, setOpenMenuId, updateSurveyLocally]
  );

  const handleDuplicate = useCallback(
    async (survey: SurveyListItem) => {
      try {
        const newTitle = `${survey.title || "Sin titulo"} (copia)`;
        const targetWorkspaceId = resolveWorkspaceId(survey.workspaceId as string);
        const payload: Record<string, unknown> = {
          title: newTitle,
          description: survey.description || "Borrador inicial",
          isActive: false,
        };
        if (hasWorkspaceModel) {
          payload.workspaceId = targetWorkspaceId || undefined;
        }
        await client.models.Survey.create(payload as any);
      } catch (err) {
        console.error("Error duplicando encuesta:", err);
        alert(t("errors.duplicateSurvey"));
      } finally {
        setOpenMenuId(null);
      }
    },
    [resolveWorkspaceId, hasWorkspaceModel, t, setOpenMenuId]
  );

  const handleMoveSurvey = useCallback(
    async (surveyId: string, workspaceId: string) => {
      if (!hasWorkspaceModel) {
        alert(t("errors.workspaceBackendMissing"));
        return;
      }
      try {
        await client.models.Survey.update({
          id: surveyId,
          workspaceId,
        } as any);
        if (activeWorkspaceId === "unassigned") {
          setActiveWorkspaceId(workspaceId);
        }
      } catch (err) {
        console.error("No se pudo mover la encuesta:", err);
        alert(t("errors.moveSurvey"));
      } finally {
        setOpenMenuId(null);
      }
    },
    [hasWorkspaceModel, activeWorkspaceId, setActiveWorkspaceId, t, setOpenMenuId]
  );

  return {
    handleShare,
    handleCopyId,
    handleDelete,
    handleToggleActive,
    handleDuplicate,
    handleMoveSurvey,
  };
}

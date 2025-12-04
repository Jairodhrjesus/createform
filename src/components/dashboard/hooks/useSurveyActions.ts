import { useCallback } from "react";
import { client } from "@/utils/amplify-utils";
import type { WorkspaceFilter } from "../WorkspaceSidebar";
import type { SurveyListItem } from "./useSurveys";
import { useToast } from "@/components/providers/ToastProvider";

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
  const { toast } = useToast();
  const copyToClipboard = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
      } catch (err) {
        console.error("No se pudo copiar:", err);
        window.prompt(t("actions.manualCopy"), text);
        toast({
          title: t("actions.copy"),
          description: t("errors.copyFailed"),
          variant: "error",
        });
      }
    },
    [t, toast]
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
      toast({
        title: t("actions.share"),
        description: t("actions.toastLinkCopied"),
        variant: "success",
      });
    },
    [locale, copyToClipboard, setOpenMenuId, t, toast]
  );

  const handleCopyId = useCallback(
    (surveyId: string) => {
      copyToClipboard(surveyId);
      setOpenMenuId(null);
      toast({
        title: t("actions.copyId"),
        description: t("actions.toastIdCopied"),
        variant: "success",
      });
    },
    [copyToClipboard, setOpenMenuId, t, toast]
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
        toast({
          title: t("actions.duplicate"),
          description: t("actions.toastDuplicated"),
          variant: "success",
        });
      } catch (err) {
        console.error("Error duplicando encuesta:", err);
        toast({
          title: t("actions.duplicate"),
          description: t("errors.duplicateSurvey"),
          variant: "error",
        });
      } finally {
        setOpenMenuId(null);
      }
    },
    [resolveWorkspaceId, hasWorkspaceModel, t, setOpenMenuId, toast]
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

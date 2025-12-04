import { useCallback, useMemo, useState } from "react";
import { client } from "@/utils/amplify-utils";
import type { WorkspaceFilter } from "../WorkspaceSidebar";
import type { SurveyListItem } from "./useSurveys";
import { useToast } from "@/components/providers/ToastProvider";
import Modal from "@/components/ui/Modal";

type Params = {
  locale: string;
  t: (key: string, values?: Record<string, unknown>) => string;
  hasWorkspaceModel: boolean;
  resolveWorkspaceId: (fallback?: string | null) => string | null;
  activeWorkspaceId: WorkspaceFilter;
  setActiveWorkspaceId: (id: WorkspaceFilter) => void;
  setOpenMenuId: (id: string | null) => void;
  updateSurveyLocally?: (id: string, patch: Partial<SurveyListItem>) => void;
  removeSurveyLocally?: (id: string) => void;
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
  removeSurveyLocally,
}: Params) {
  const { toast } = useToast();
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deletingSurvey, setDeletingSurvey] = useState(false);

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
      setDeleteTargetId(id);
      setOpenMenuId(null);
    },
    [setOpenMenuId]
  );

  const closeDeleteModal = useCallback(() => {
    if (deletingSurvey) return;
    setDeleteTargetId(null);
  }, [deletingSurvey]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTargetId) return;
    try {
      setDeletingSurvey(true);
      await client.models.Survey.delete({ id: deleteTargetId });
      if (removeSurveyLocally) {
        removeSurveyLocally(deleteTargetId);
      }
      toast({
        title: t("actions.delete"),
        description: t("actions.toastDeleted"),
        variant: "success",
      });
    } catch (err) {
      console.error("No se pudo eliminar la encuesta:", err);
      toast({
        title: t("actions.delete"),
        description: t("errors.deleteSurvey"),
        variant: "error",
      });
    } finally {
      setDeletingSurvey(false);
      setDeleteTargetId(null);
    }
  }, [deleteTargetId, t, toast]);

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

  const deleteModal = useMemo(
    () => (
      <Modal
        open={Boolean(deleteTargetId)}
        onClose={closeDeleteModal}
        title={t("actions.deleteModal.title")}
        description={t("actions.deleteModal.description")}
        size="sm"
        footer={
          <>
            <button
              onClick={closeDeleteModal}
              disabled={deletingSurvey}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("actions.deleteModal.cancel")}
            </button>
            <button
              onClick={confirmDelete}
              disabled={!deleteTargetId || deletingSurvey}
              className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deletingSurvey ? t("actions.deleteModal.deleting") : t("actions.deleteModal.confirm")}
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600">{t("actions.deleteModal.warning")}</p>
      </Modal>
    ),
    [closeDeleteModal, confirmDelete, deleteTargetId, deletingSurvey, t]
  );

  return {
    handleShare,
    handleCopyId,
    handleDelete,
    handleToggleActive,
    handleDuplicate,
    handleMoveSurvey,
    deleteModal,
  };
}

import { useCallback, useState } from "react";
import type { Schema } from "@/amplify/data/resource";
import type { WorkspaceFilter } from "../WorkspaceSidebar";
import { useToast } from "@/components/providers/ToastProvider";

type WorkspaceType = Schema["Workspace"]["type"];

type Params = {
  workspaceModel: any;
  hasWorkspaceModel: boolean;
  activeWorkspaceId: WorkspaceFilter;
  workspaces: WorkspaceType[];
  setActiveWorkspaceId: (id: WorkspaceFilter) => void;
  t: (key: string, values?: Record<string, any>) => string;
};

export function useDeleteWorkspace({
  workspaceModel,
  hasWorkspaceModel,
  activeWorkspaceId,
  workspaces,
  setActiveWorkspaceId,
  t,
}: Params) {
  const { toast } = useToast();
  const [deletingWorkspace, setDeletingWorkspace] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState<string>("");
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const openDeleteWorkspaceModal = useCallback(() => {
    if (!hasWorkspaceModel || !workspaceModel?.delete) {
      setDeleteError(t("errors.workspaceBackendMissing"));
      toast({
        title: t("actions.delete"),
        description: t("errors.workspaceBackendMissing"),
        variant: "error",
      });
      return;
    }
    if (activeWorkspaceId === "all" || activeWorkspaceId === "unassigned") return;
    const targetWorkspace = workspaces.find((ws) => ws.id === activeWorkspaceId);
    setDeleteTargetId(activeWorkspaceId as string);
    setDeleteTargetName(targetWorkspace?.name || t("untitledWorkspace"));
    setDeleteConfirmInput("");
    setDeleteError(null);
  }, [activeWorkspaceId, hasWorkspaceModel, t, workspaceModel, workspaces]);

  const closeDeleteWorkspaceModal = useCallback(() => {
    setDeleteTargetId(null);
    setDeleteTargetName("");
    setDeleteConfirmInput("");
    setDeleteError(null);
  }, []);

  const handleConfirmDeleteWorkspace = useCallback(async () => {
    if (!deleteTargetId) return;
    if (!hasWorkspaceModel || !workspaceModel?.delete) {
      setDeleteError(t("errors.workspaceBackendMissing"));
      toast({
        title: t("actions.delete"),
        description: t("errors.workspaceBackendMissing"),
        variant: "error",
      });
      return;
    }
    if (deleteConfirmInput.trim() !== deleteTargetName) {
      setDeleteError(t("toolbar.deleteModal.nameMismatch"));
      return;
    }

    const fallbackWorkspaceId = workspaces.find((ws) => ws.id !== deleteTargetId)?.id as
      | string
      | undefined;

    setDeletingWorkspace(true);
    setDeleteError(null);
    try {
      const { errors } = await workspaceModel.delete({ id: deleteTargetId } as any);
      if (errors) {
        console.error("Error deleting workspace:", errors);
        setDeleteError(t("errors.workspaceDelete"));
        return;
      }

      if (fallbackWorkspaceId) {
        setActiveWorkspaceId(fallbackWorkspaceId as string);
      } else {
        setActiveWorkspaceId("all");
      }
      closeDeleteWorkspaceModal();
      toast({
        title: t("actions.delete"),
        description: t("toolbar.toastWorkspaceDeleted"),
        variant: "success",
      });
    } catch (err) {
      console.error("Error deleting workspace:", err);
      setDeleteError(t("errors.workspaceDelete"));
      toast({
        title: t("actions.delete"),
        description: t("errors.workspaceDelete"),
        variant: "error",
      });
    } finally {
      setDeletingWorkspace(false);
    }
  }, [
    closeDeleteWorkspaceModal,
    deleteConfirmInput,
    deleteTargetId,
    deleteTargetName,
    hasWorkspaceModel,
    setActiveWorkspaceId,
    t,
    workspaceModel,
    workspaces,
  ]);

  return {
    modalOpen: Boolean(deleteTargetId),
    deleteTargetName,
    deleteConfirmInput,
    setDeleteConfirmInput,
    deleteError,
    deletingWorkspace,
    openDeleteWorkspaceModal,
    closeDeleteWorkspaceModal,
    handleConfirmDeleteWorkspace,
  };
}

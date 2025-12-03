import { useCallback, useState } from "react";
import type { Schema } from "@/amplify/data/resource";

type WorkspaceType = Schema["Workspace"]["type"];

type Params = {
  hasWorkspaceModel: boolean;
  workspaceModel: any;
  workspaces: WorkspaceType[];
  setActiveWorkspaceId: (id: string) => void;
  setCreateWorkspaceId: (id: string | null) => void;
};

// Alta de workspaces con validaciones y estado de carga.
export function useCreateWorkspace({
  hasWorkspaceModel,
  workspaceModel,
  workspaces,
  setActiveWorkspaceId,
  setCreateWorkspaceId,
}: Params) {
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceDesc, setWorkspaceDesc] = useState("");
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [savingWorkspace, setSavingWorkspace] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);

  const handleCreateWorkspace = useCallback(() => {
    setWorkspaceError(null);
    setWorkspaceName("");
    setWorkspaceDesc("");
    setShowWorkspaceModal(true);
  }, []);

  const submitWorkspace = useCallback(
    async (t: (key: string) => string) => {
      if (!hasWorkspaceModel || !workspaceModel?.create) {
        setWorkspaceError(t("errors.workspaceBackendMissing"));
        return;
      }
      if (!workspaceName.trim()) {
        setWorkspaceError(t("errors.workspaceNameRequired"));
        return;
      }
      setSavingWorkspace(true);
      const payload = {
        name: workspaceName.trim(),
        description: workspaceDesc.trim() || "Espacio de trabajo",
        isDefault: workspaces.length === 0,
      };
      const { data, errors } = await workspaceModel.create(
        payload as unknown as Schema["Workspace"]["createType"]
      );
      setSavingWorkspace(false);

      if (errors) {
        console.error(errors);
        setWorkspaceError(t("errors.workspaceCreate"));
        return;
      }

      if (data?.id) {
        setActiveWorkspaceId(data.id as string);
        setCreateWorkspaceId(data.id as string);
      }
      setShowWorkspaceModal(false);
      setWorkspaceName("");
      setWorkspaceDesc("");
      setWorkspaceError(null);
    },
    [
      hasWorkspaceModel,
      workspaceModel,
      workspaceName,
      workspaceDesc,
      workspaces.length,
      setActiveWorkspaceId,
      setCreateWorkspaceId,
    ]
  );

  const closeWorkspaceModal = useCallback(() => {
    setShowWorkspaceModal(false);
    setWorkspaceError(null);
  }, []);

  return {
    workspaceName,
    workspaceDesc,
    workspaceError,
    savingWorkspace,
    showWorkspaceModal,
    setShowWorkspaceModal,
    setWorkspaceName,
    setWorkspaceDesc,
    handleCreateWorkspace,
    submitWorkspace,
    closeWorkspaceModal,
  };
}

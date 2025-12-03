import { useMemo } from "react";
import { useCreateSurvey } from "./useCreateSurvey";
import { useCreateWorkspace } from "./useCreateWorkspace";

type Params = {
  createSurvey: ReturnType<typeof useCreateSurvey>;
  createWorkspace: ReturnType<typeof useCreateWorkspace>;
};

// Centraliza apertura/cierre de modales y limpieza de errores.
export function useDashboardModals({ createSurvey, createWorkspace }: Params) {
  return useMemo(
    () => ({
      openSurveyModal: () => {
        createSurvey.setCreateError(null);
        createSurvey.setShowCreateModal(true);
      },
      closeSurveyModal: () => {
        createSurvey.setCreateError(null);
        createSurvey.setShowCreateModal(false);
      },
      openWorkspaceModal: () => {
        createWorkspace.handleCreateWorkspace();
      },
      closeWorkspaceModal: () => {
        createWorkspace.closeWorkspaceModal();
      },
    }),
    [createSurvey, createWorkspace]
  );
}

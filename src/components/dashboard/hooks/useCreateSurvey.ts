import { useCallback, useState } from "react";
import { client } from "@/utils/amplify-utils";

type Params = {
  hasWorkspaceModel: boolean;
  resolveWorkspaceId: (fallback?: string | null) => string | null;
};

// Alta de encuestas, validando workspace requerido cuando aplica.
export function useCreateSurvey({ hasWorkspaceModel, resolveWorkspaceId }: Params) {
  const [newSurveyTitle, setNewSurveyTitle] = useState("");
  const [createWorkspaceId, setCreateWorkspaceId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [savingSurvey, setSavingSurvey] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const syncWorkspaceSelection = useCallback(
    (workspaceId: string | null) => setCreateWorkspaceId(workspaceId),
    []
  );

  const submitCreateSurvey = useCallback(
    async (t: (key: string) => string) => {
      setCreateError(null);
      if (!newSurveyTitle.trim()) {
        setCreateError(t("errors.surveyTitleRequired"));
        return;
      }

      const workspaceId = hasWorkspaceModel
        ? createWorkspaceId || resolveWorkspaceId(null)
        : null;

      if (hasWorkspaceModel && !workspaceId) {
        setCreateError(t("errors.workspaceRequired"));
        return;
      }

      const payload: Record<string, unknown> = {
        title: newSurveyTitle.trim(),
        description: "Borrador inicial",
        isActive: true,
      };

      if (hasWorkspaceModel && workspaceId) {
        payload.workspaceId = workspaceId;
      }

      setSavingSurvey(true);
      const { errors } = await client.models.Survey.create(payload as any);
      setSavingSurvey(false);

      if (errors) {
        console.error(errors);
        setCreateError(t("errors.surveyCreate"));
        return;
      }

      setShowCreateModal(false);
      setNewSurveyTitle("");
      setCreateError(null);
    },
    [newSurveyTitle, hasWorkspaceModel, createWorkspaceId, resolveWorkspaceId]
  );

  return {
    newSurveyTitle,
    createWorkspaceId,
    createError,
    savingSurvey,
    showCreateModal,
    setShowCreateModal,
    setNewSurveyTitle,
    setCreateError,
    setCreateWorkspaceId,
    syncWorkspaceSelection,
    submitCreateSurvey,
  };
}

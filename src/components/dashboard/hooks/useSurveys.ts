import { useCallback, useEffect, useMemo, useState } from "react";
import { client } from "@/utils/amplify-utils";
import type { WorkspaceFilter } from "../WorkspaceSidebar";

export type SurveyListItem = {
  id: string;
  title?: string | null;
  description?: string | null;
  isActive?: boolean | null;
  workspaceId?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
  _lastChangedAt?: number | null;
  submissionCount?: number;
};

type Params = {
  activeWorkspaceId: WorkspaceFilter;
  hasWorkspaceModel: boolean;
  search: string;
  sortKey: "updatedAt" | "createdAt" | "title";
};

// Maneja suscripción a encuestas y derivaciones (filtros, conteos).
export function useSurveys({ activeWorkspaceId, hasWorkspaceModel, search, sortKey }: Params) {
  const [surveys, setSurveys] = useState<SurveyListItem[]>([]);
  const [submissions, setSubmissions] = useState<{ surveyId: string }[]>([]);

  useEffect(() => {
    const surveySub = (client.models.Survey as any).observeQuery({
      selectionSet: [
        "id",
        "title",
        "description",
        "isActive",
        "workspaceId",
        "updatedAt",
        "createdAt",
      ],
    }).subscribe({
      next: ({ items }: any) => setSurveys(items as SurveyListItem[]),
    });

    const submissionSub = client.models.Submission.observeQuery({
      selectionSet: ["surveyId"],
      authMode: "apiKey",
    }).subscribe({
      next: ({ items }) => setSubmissions(items as { surveyId: string }[]),
    });

    return () => {
      surveySub.unsubscribe();
      submissionSub.unsubscribe();
    };
  }, []);

  const submissionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const sub of submissions) {
      if (sub.surveyId) {
        counts[sub.surveyId] = (counts[sub.surveyId] || 0) + 1;
      }
    }
    return counts;
  }, [submissions]);

  const surveysWithCounts = useMemo(() => {
    return surveys.map(s => ({
      ...s,
      submissionCount: submissionCounts[s.id] || 0,
    }));
  }, [surveys, submissionCounts]);

  const workspaceSurveyCounts = useMemo(() => {
    if (!hasWorkspaceModel) return {};
    const counts: Record<string, number> = {};
    surveys.forEach((s) => {
      const key = (s.workspaceId as string) || "unassigned";
      counts[key] = (counts[key] ?? 0) + 1;
    });
    return counts;
  }, [surveys, hasWorkspaceModel]);

  const hasUnassigned = hasWorkspaceModel && workspaceSurveyCounts["unassigned"] > 0;

  const filteredSurveys = useMemo(() => {
    const getUpdatedValue = (s: SurveyListItem) => s.updatedAt || s.createdAt || null;

    const byWorkspace = hasWorkspaceModel
      ? surveysWithCounts.filter((s) => {
          if (activeWorkspaceId === "all") return true;
          if (activeWorkspaceId === "unassigned") return !s.workspaceId;
          return s.workspaceId === activeWorkspaceId;
        })
      : surveysWithCounts;

    const bySearch = !search.trim()
      ? byWorkspace
      : byWorkspace.filter((s) => s.title?.toLowerCase().includes(search.toLowerCase()));

    const sorted = [...bySearch].sort((a, b) => {
      if (sortKey === "title") {
          return (a.title || "").localeCompare(b.title || "");
      }
      const aTime = sortKey === "updatedAt" ? getUpdatedValue(a) : a.createdAt;
      const bTime = sortKey === "updatedAt" ? getUpdatedValue(b) : b.createdAt;
      const aMs = aTime ? new Date(aTime as any).getTime() : 0;
      const bMs = bTime ? new Date(bTime as any).getTime() : 0;
      return bMs - aMs; // más recientes primero
    });

    return sorted;
  }, [surveysWithCounts, search, activeWorkspaceId, hasWorkspaceModel, sortKey]);

  const updateSurveyLocally = useCallback(
    (id: string, patch: Partial<SurveyListItem>) => {
      setSurveys((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
      );
    },
    []
  );

  return {
    surveys: surveysWithCounts,
    filteredSurveys,
    workspaceSurveyCounts,
    hasUnassigned,
    updateSurveyLocally,
  };
}

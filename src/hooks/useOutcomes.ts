"use client";

import { useEffect, useState, useCallback } from "react";
import type { Schema } from "@/amplify/data/resource";
import { client } from "@/utils/amplify-utils";

type OutcomeType = Schema["Outcome"]["type"];

export function useOutcomes(surveyId: string) {
  const [outcomes, setOutcomes] = useState<OutcomeType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!surveyId) return;
    setLoading(true);
    const sub = client.models.Outcome.observeQuery({
      filter: { surveyId: { eq: surveyId } },
    }).subscribe({
      next: ({ items }) => {
        const ordered = items
          .slice()
          .sort((a, b) => (a.minScore ?? 0) - (b.minScore ?? 0));
        setOutcomes(ordered);
        setLoading(false);
      },
      error: () => setLoading(false),
    });
    return () => sub.unsubscribe();
  }, [surveyId]);

  const addOutcome = useCallback(
    async (partial: Partial<OutcomeType> = {}) => {
      if (!surveyId) return null;
      const payload: Schema["Outcome"]["createType"] = {
        surveyId,
        title: partial.title || "New Ending",
        description: partial.description || "",
        minScore: partial.minScore ?? 0,
        maxScore: partial.maxScore ?? 0,
        redirectUrl: partial.redirectUrl,
      } as any;
      const { data } = await client.models.Outcome.create(payload);
      return data;
    },
    [surveyId]
  );

  const updateOutcome = useCallback(async (id: string, updates: Partial<OutcomeType>) => {
    if (!id) return;
    await client.models.Outcome.update({ id, ...updates } as any);
    setOutcomes((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...updates } : o))
    );
  }, []);

  const deleteOutcome = useCallback(async (id: string) => {
    if (!id) return;
    await client.models.Outcome.delete({ id });
    setOutcomes((prev) => prev.filter((o) => o.id !== id));
  }, []);

  return { outcomes, loading, addOutcome, updateOutcome, deleteOutcome };
}

export default useOutcomes;

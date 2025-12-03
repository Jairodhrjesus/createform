"use client";
import { useEffect, useState } from "react";
import { client } from "@/utils/amplify-utils";
import type { Schema } from "@/amplify/data/resource";

type SurveyType = Schema["Survey"]["type"];

export function useSurveyMeta(surveyId: string) {
  const [survey, setSurvey] = useState<SurveyType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!surveyId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // There isn't a simple way to observe a single record by ID with subscriptions,
    // so we will fetch the survey once and then rely on page re-evaluation
    // if deeper reactivity is needed in the future, a more complex subscription
    // pattern might be required.
    const fetchSurvey = async () => {
      try {
        const { data } = await client.models.Survey.get(
          { id: surveyId },
          {
            authMode: "userPool",
          }
        );
        setSurvey(data as SurveyType);
      } catch (err: any) {
        console.error(`Error loading survey meta for ${surveyId}:`, err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    void fetchSurvey();

    // Note: If real-time updates for survey metadata are needed,
    // you might observe the entire list and filter, but that's less efficient.
    // For now, a single fetch is likely sufficient.

  }, [surveyId]);

  return { survey, loading, error };
}

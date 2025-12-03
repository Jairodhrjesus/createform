"use client";
import { useEffect, useState } from "react";
import { client } from "@/utils/amplify-utils";
import type { Schema } from "@/amplify/data/resource";

type SubmissionType = Schema["Submission"]["type"];

export function useSubmissionsBySurvey(surveyId: string) {
  const [submissions, setSubmissions] = useState<SubmissionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!surveyId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const sub = client.models.Submission.observeQuery({
      filter: {
        surveyId: {
          eq: surveyId,
        },
      },
      authMode: "apiKey",
    }).subscribe({
      next: ({ items }) => {
        setSubmissions(items as SubmissionType[]);
        setLoading(false);
      },
      error: (err: any) => {
        console.error(`Error loading submissions for survey ${surveyId}:`, err);
        setError(err);
        setLoading(false);
      },
    });

    return () => {
      sub.unsubscribe();
    };
  }, [surveyId]);

  return { submissions, loading, error };
}

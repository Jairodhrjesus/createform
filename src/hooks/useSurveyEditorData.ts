"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Schema } from "@/amplify/data/resource";
import { client } from "@/utils/amplify-utils";

type QuestionType = Schema["Question"]["type"];
type SurveyType = Schema["Survey"]["type"];

interface UseSurveyEditorData {
  survey: SurveyType | null;
  questions: QuestionType[];
  loading: boolean;
  selectedQuestionId: string | null;
  selectedQuestion: QuestionType | null;
  selectQuestion: (id: string) => void;
  addQuestion: (text: string) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  refreshSurvey: () => Promise<void>;
  updateQuestionText: (id: string, text: string) => Promise<void>;
  updateQuestionType: (id: string, type: string) => Promise<void>;
  reorderQuestion: (id: string, targetIndex: number) => Promise<void>;
}

export function useSurveyEditorData(surveyId: string): UseSurveyEditorData {
  const [survey, setSurvey] = useState<SurveyType | null>(null);
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

  useEffect(() => {
    if (!surveyId) return;

    setLoading(true);

    client.models.Survey.get({ id: surveyId }).then(({ data }) => {
      setSurvey(data);
      setLoading(false);
    });

    const sub = client.models.Question.observeQuery({
      filter: { surveyId: { eq: surveyId } },
    }).subscribe({
      next: ({ items }) => {
        const ordered = items
          .slice()
          .sort((a, b) => {
            const ao = a.order ?? Number.MAX_SAFE_INTEGER;
            const bo = b.order ?? Number.MAX_SAFE_INTEGER;
            if (ao !== bo) return ao - bo;
            return (a.createdAt || "") > (b.createdAt || "") ? 1 : -1;
          });
        setQuestions(ordered);
      },
    });

    return () => sub.unsubscribe();
  }, [surveyId]);

  useEffect(() => {
    if (!questions.length) {
      setSelectedQuestionId(null);
      return;
    }
    if (!selectedQuestionId) {
      setSelectedQuestionId(questions[0].id);
    } else {
      const exists = questions.find((q) => q.id === selectedQuestionId);
      if (!exists) {
        setSelectedQuestionId(questions[0].id);
      }
    }
  }, [questions, selectedQuestionId]);

  const selectedQuestion = useMemo(() => {
    if (!selectedQuestionId) return null;
    return questions.find((q) => q.id === selectedQuestionId) || null;
  }, [questions, selectedQuestionId]);

  const selectQuestion = useCallback((id: string) => {
    setSelectedQuestionId(id);
  }, []);

  const addQuestion = useCallback(
    async (text: string) => {
      if (!text.trim() || !surveyId) return;
      const nextOrder =
        questions.length === 0
          ? 1
          : Math.max(
              ...questions.map((q) => (typeof q.order === "number" ? q.order : 0))
            ) + 1;
      const { data } = await client.models.Question.create({
        surveyId,
        text,
        order: nextOrder,
      } as unknown as Schema["Question"]["createType"]);

      if (data) {
        setQuestions((prev) =>
          [...prev, data].sort((a, b) => {
            const ao = a.order ?? Number.MAX_SAFE_INTEGER;
            const bo = b.order ?? Number.MAX_SAFE_INTEGER;
            if (ao !== bo) return ao - bo;
            return (a.createdAt || "") > (b.createdAt || "") ? 1 : -1;
          })
        );
        setSelectedQuestionId(data.id);
      }
    },
    [questions.length, surveyId]
  );

  const deleteQuestion = useCallback(
    async (id: string) => {
      if (!id) return;
      await client.models.Question.delete({ id });
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      if (selectedQuestionId === id) {
        setSelectedQuestionId(null);
      }
    },
    [selectedQuestionId]
  );

  const updateQuestionText = useCallback(
    async (id: string, text: string) => {
      if (!id || !text.trim()) return;
      await client.models.Question.update({
        id,
        text,
      } as unknown as Schema["Question"]["updateType"]);

      setQuestions((prev) =>
        prev.map((q) => (q.id === id ? { ...q, text } : q))
      );
    },
    []
  );

  const updateQuestionType = useCallback(
    async (id: string, type: string) => {
      if (!id || !type) return;
      await client.models.Question.update({
        id,
        type,
      } as unknown as Schema["Question"]["updateType"]);

      setQuestions((prev) =>
        prev.map((q) => (q.id === id ? { ...q, type } : q))
      );
    },
    []
  );

  const reorderQuestion = useCallback(
    async (id: string, targetIndex: number) => {
      if (!id) return;
      setQuestions((prev) => {
        const idx = prev.findIndex((q) => q.id === id);
        if (idx === -1) return prev;
        const boundedIndex = Math.min(Math.max(targetIndex, 0), prev.length - 1);
        if (boundedIndex === idx) return prev;
        const reordered = [...prev];
        const [moved] = reordered.splice(idx, 1);
        reordered.splice(boundedIndex, 0, moved);
        const withOrder = reordered.map((q, i) => ({ ...q, order: i + 1 }));
        Promise.all(
          withOrder.map((q) =>
            client.models.Question.update({
              id: q.id,
              order: q.order,
            } as unknown as Schema["Question"]["updateType"])
          )
        ).catch((err) => console.error("No se pudo reordenar preguntas", err));
        return withOrder;
      });
    },
    []
  );

  const refreshSurvey = useCallback(async () => {
    if (!surveyId) return;
    const { data } = await client.models.Survey.get({ id: surveyId });
    setSurvey(data);
  }, [surveyId]);

  return {
    survey,
    questions,
    loading,
    selectedQuestionId,
    selectedQuestion,
    selectQuestion,
    addQuestion,
    deleteQuestion,
    refreshSurvey,
    updateQuestionText,
    updateQuestionType,
    reorderQuestion,
  };
}

export default useSurveyEditorData;

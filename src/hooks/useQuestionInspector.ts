"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import type { Schema } from "@/amplify/data/resource";

type QuestionType = Schema["Question"]["type"];

/**
 * Maneja estado auxiliar del inspector (p.ej. flag de requerido).
 * Hoy el requerido es solo de UI; cuando exista campo en backend se puede persistir aquí.
 */
export function useQuestionInspector(question: QuestionType | null) {
  const [requiredMap, setRequiredMap] = useState<Record<string, boolean>>({});

  const required = useMemo(() => {
    if (!question?.id) return false;
    return requiredMap[question.id] ?? false;
  }, [question?.id, requiredMap]);

  useEffect(() => {
    if (question?.id && !(question.id in requiredMap)) {
      setRequiredMap((prev) => ({ ...prev, [question.id!]: false }));
    }
  }, [question?.id, requiredMap]);

  const toggleRequired = useCallback(() => {
    if (!question?.id) return;
    setRequiredMap((prev) => ({
      ...prev,
      [question.id!]: !prev[question.id!],
    }));
  }, [question?.id]);

  return { required, toggleRequired };
}

export default useQuestionInspector;

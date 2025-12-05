"use client";

import { useCallback, useState } from "react";
import {
  LeadCaptureField,
  LeadCaptureFieldType,
  createLeadField,
  sanitizeLeadFields,
} from "@/utils/leadCapture";

export function useLeadCaptureBlocks(initial?: LeadCaptureField[]) {
  const [fields, setFields] = useState<LeadCaptureField[]>(() =>
    sanitizeLeadFields(initial)
  );

  const resetFields = useCallback((incoming?: LeadCaptureField[]) => {
    setFields(sanitizeLeadFields(incoming));
  }, []);

  const addField = useCallback((type: LeadCaptureFieldType) => {
    setFields((prev) => [...prev, createLeadField(type)]);
  }, []);

  const removeField = useCallback((id: string) => {
    setFields((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((field) => field.id !== id);
    });
  }, []);

  const updateField = useCallback(
    (id: string, updates: Partial<LeadCaptureField>) => {
      setFields((prev) =>
        prev.map((field) => (field.id === id ? { ...field, ...updates } : field))
      );
    },
    []
  );

  const toggleRequired = useCallback((id: string) => {
    setFields((prev) =>
      prev.map((field) =>
        field.id === id ? { ...field, required: !field.required } : field
      )
    );
  }, []);

  const moveField = useCallback((id: string, direction: "up" | "down") => {
    setFields((prev) => {
      const index = prev.findIndex((f) => f.id === id);
      if (index === -1) return prev;
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  return {
    fields,
    resetFields,
    addField,
    removeField,
    updateField,
    toggleRequired,
    moveField,
  };
}


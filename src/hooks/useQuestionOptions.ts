"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { Schema } from "@/amplify/data/resource";
import { client } from "@/utils/amplify-utils";

type OptionType = Schema["Option"]["type"];

interface UseQuestionOptions {
  options: OptionType[];
  loading: boolean;
  addOption: (text: string, score?: number) => Promise<void>;
  deleteOption: (id: string) => Promise<void>;
  updateOption: (id: string, updates: Partial<OptionType>) => Promise<void>;
}

const sortOptions = (items: OptionType[]) =>
  items
    .slice()
    .sort((a, b) => {
      const scoreDiff = (a.score ?? 0) - (b.score ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      const aNum = Number(a.text);
      const bNum = Number(b.text);
      if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) return aNum - bNum;
      return (a.text || "").localeCompare(b.text || "");
    });

export function useQuestionOptions(
  questionId: string | null,
  questionType?: string,
  autoSeedDefaults: boolean = false
): UseQuestionOptions {
  const [options, setOptions] = useState<OptionType[]>([]);
  const [loading, setLoading] = useState(false);
  const [optionsReady, setOptionsReady] = useState(false);
  const seededRef = useRef<string | null>(null);

  useEffect(() => {
    if (!questionId) {
      setOptions([]);
      setOptionsReady(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setOptionsReady(false);
    const sub = client.models.Option.observeQuery({
      filter: { questionId: { eq: questionId } },
    }).subscribe({
      next: ({ items }) => {
        setOptions(sortOptions(items));
        setLoading(false);
        setOptionsReady(true);
      },
      error: () => {
        setLoading(false);
        setOptionsReady(true);
      },
    });
    return () => sub.unsubscribe();
  }, [questionId]);

  useEffect(() => {
    // Reset seed marker when switching question or type
    if (seededRef.current && seededRef.current !== questionId) {
      seededRef.current = null;
    }
  }, [questionId, questionType]);

  useEffect(() => {
    if (!autoSeedDefaults) return;
    if (!questionId || !questionType) return;
    if (!optionsReady) return;
    if (options.length > 0) {
      seededRef.current = questionId;
      return;
    }
    if (seededRef.current === questionId) return;

    const defaults =
      questionType === "linear_scale"
        ? Array.from({ length: 10 }, (_, idx) => ({
            text: String(idx + 1),
            score: 1,
          }))
        : questionType === "rating"
        ? Array.from({ length: 5 }, (_, idx) => ({
            text: `Estrella ${idx + 1}`,
            score: 1,
          }))
        : null;

    if (!defaults) return;

    seededRef.current = questionId;

    Promise.all(
      defaults.map((opt) =>
        client.models.Option.create({
          questionId,
          ...opt,
        } as unknown as Schema["Option"]["createType"])
      )
    ).catch(() => {
      // Allow another attempt if seed fails
      seededRef.current = null;
    });
  }, [autoSeedDefaults, options.length, optionsReady, questionId, questionType]);

  const addOption = useCallback(
    async (text: string, score: number = 0) => {
      if (!questionId || !text.trim()) return;
      const normalizedScore =
        Number.isFinite(score) && typeof score === "number" ? score : 0;
      const { data } = await client.models.Option.create({
        questionId,
        text: text.trim(),
        score: normalizedScore,
      } as unknown as Schema["Option"]["createType"]);

      if (data) {
        setOptions((prev) => sortOptions([...prev, data]));
      }
    },
    [questionId]
  );

  const deleteOption = useCallback(async (id: string) => {
    if (!id) return;
    await client.models.Option.delete({ id });
    setOptions((prev) => prev.filter((opt) => opt.id !== id));
  }, []);

  const updateOption = useCallback(async (id: string, updates: Partial<OptionType>) => {
    if (!id) return;
    const payload: Partial<Schema["Option"]["updateType"]> = { id };
    if (typeof updates.text === "string") {
      payload.text = updates.text;
    }
    if (typeof updates.score === "number" && !Number.isNaN(updates.score)) {
      payload.score = updates.score;
    }
    const { data } = await client.models.Option.update(
      payload as Schema["Option"]["updateType"]
    );

    if (data) {
      setOptions((prev) =>
        sortOptions(
          prev.map((opt) =>
            opt.id === id ? { ...opt, ...updates, id: opt.id } : opt
          )
        )
      );
    }
  }, []);

  return { options, loading, addOption, deleteOption, updateOption };
}

export default useQuestionOptions;

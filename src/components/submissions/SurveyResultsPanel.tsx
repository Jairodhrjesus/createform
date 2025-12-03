"use client";
import { useMemo, useState, useCallback } from "react";
import { useLocale } from "next-intl";
import type { Schema } from "@/amplify/data/resource";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

type SubmissionType = Schema["Submission"]["type"];
type SurveyType = Schema["Survey"]["type"];

interface SurveyResultsPanelProps {
  survey: SurveyType;
  submissions: SubmissionType[];
  isLoading: boolean;
}

const countAnswers = (answersContent: SubmissionType["answersContent"]): number => {
  if (!answersContent) return 0;
  if (typeof answersContent === "string") {
    try {
      const parsed = JSON.parse(answersContent);
      return parsed && typeof parsed === "object" ? Object.keys(parsed).length : 0;
    } catch {
      return 0;
    }
  }
  return typeof answersContent === "object" ? Object.keys(answersContent).length : 0;
};

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value as string);
  return isNaN(parsed.getTime()) ? null : parsed;
};

export default function SurveyResultsPanel({
  survey,
  submissions,
  isLoading,
}: SurveyResultsPanelProps) {
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState<string>("all");

  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale || "es", { dateStyle: "medium", timeStyle: "short" }), [locale]);
  const formatDate = useCallback((value: Date | null) => value ? dateFormatter.format(value) : "--", [dateFormatter]);
  const formatNumber = useCallback((value: number) => new Intl.NumberFormat(locale || "es").format(value), [locale]);

  const allOutcomes = useMemo(() => {
    const outcomes = new Set<string>();
    submissions.forEach(sub => sub.outcomeTitle && outcomes.add(sub.outcomeTitle));
    return ["all", ...Array.from(outcomes)];
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    const byOutcome = outcomeFilter === "all"
      ? submissions
      : submissions.filter(sub => sub.outcomeTitle === outcomeFilter);
    
    return search.trim()
      ? byOutcome.filter(sub => {
          const term = search.toLowerCase();
          return (
            sub.respondentEmail?.toLowerCase().includes(term) ||
            sub.respondentName?.toLowerCase().includes(term) ||
            JSON.stringify(sub.answersContent || "{}").toLowerCase().includes(term)
          );
        })
      : byOutcome;
  }, [submissions, search, outcomeFilter]);

  const metrics = useMemo(() => {
    const totalSubmissions = submissions.length;
    if (totalSubmissions === 0) {
      return {
        totalSubmissions: 0,
        averageScore: 0,
        averageAnswered: 0,
        uniqueRespondents: 0,
        leadsWithEmail: 0,
        topOutcome: null,
      };
    }

    const totalScore = submissions.reduce((sum, sub) => sum + (sub.totalScore || 0), 0);
    const answeredCount = submissions.reduce((sum, sub) => sum + countAnswers(sub.answersContent), 0);
    const respondentIds = new Set(submissions.map(sub => sub.respondentId ? String(sub.respondentId) : `sub-${sub.id}`));
    
    const outcomeCounts: Record<string, number> = {};
    submissions.forEach(sub => {
      const key = sub.outcomeTitle || "Sin resultado";
      outcomeCounts[key] = (outcomeCounts[key] || 0) + 1;
    });

    const topOutcomeEntry = Object.entries(outcomeCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      totalSubmissions,
      averageScore: Number((totalScore / totalSubmissions).toFixed(1)),
      averageAnswered: Number((answeredCount / totalSubmissions).toFixed(1)),
      uniqueRespondents: respondentIds.size,
      leadsWithEmail: submissions.filter(sub => sub.respondentEmail).length,
      topOutcome: {
        title: topOutcomeEntry[0],
        percent: Math.round((topOutcomeEntry[1] / totalSubmissions) * 100),
      },
    };
  }, [submissions]);
  
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60">
        <div className="flex items-center gap-3 text-slate-600">
          <LoadingSpinner />
          <span>Cargando resultados de la encuesta...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Resultados de Encuesta
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {survey.title}
            </h1>
            <p className="text-sm text-slate-600 line-clamp-2">
              {survey.description || "Análisis detallado de las respuestas."}
            </p>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total respuestas</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{formatNumber(metrics.totalSubmissions)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Promedio de score</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{metrics.averageScore}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Leads con email</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{formatNumber(metrics.leadsWithEmail)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resultado principal</p>
          {metrics.topOutcome ? (
            <div className="mt-2">
              <p className="text-lg font-semibold text-slate-900">{metrics.topOutcome.title}</p>
              <p className="text-xs text-slate-500">{metrics.topOutcome.percent}% de las respuestas</p>
            </div>
          ) : <p className="mt-2 text-lg font-semibold text-slate-400">Sin datos</p>}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Respondentes unicos</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{formatNumber(metrics.uniqueRespondents)}</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Todas las respuestas</p>
            <p className="text-xs text-slate-500">Filtra y busca entre las respuestas individuales.</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
              disabled={allOutcomes.length <= 2}
            >
              {allOutcomes.map(outcome => (
                <option key={outcome} value={outcome}>{outcome === 'all' ? 'Todos los resultados' : outcome}</option>
              ))}
            </select>
            <input
              type="search"
              placeholder="Buscar en respuestas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
            />
          </div>
        </div>

        {filteredSubmissions.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-semibold text-slate-700">No hay respuestas que coincidan con tus filtros.</p>
            <p className="text-sm text-slate-500">Intenta con otros terminos de busqueda o filtros.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            <div className="grid grid-cols-12 gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span className="col-span-3">Lead</span>
              <span className="col-span-3">Resultado</span>
              <span className="col-span-2 text-right">Score</span>
              <span className="col-span-4 text-right">Fecha</span>
            </div>
            {filteredSubmissions.map(sub => (
              <div key={sub.id} className="grid grid-cols-12 items-center gap-3 px-4 py-3 text-sm">
                <div className="col-span-3">
                  <p className="font-semibold text-slate-900">{sub.respondentName || "Anonimo"}</p>
                  <p className="text-xs text-slate-600">{sub.respondentEmail}</p>
                </div>
                <div className="col-span-3">
                  <p className="font-semibold text-slate-800">{sub.outcomeTitle || "N/A"}</p>
                </div>
                <div className="col-span-2 text-right">
                  <span className="font-mono text-base font-semibold text-slate-900">{sub.totalScore || 0}</span>
                </div>
                <div className="col-span-4 text-right">
                  <p className="font-semibold text-slate-800">{formatDate(toDate(sub.createdAt))}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

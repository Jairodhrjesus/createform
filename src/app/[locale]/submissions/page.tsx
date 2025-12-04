"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useLocale } from "next-intl";
import AuthGuard from "@/components/AuthGuard";
import Navbar from "@/components/layout/Navbar";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { DropdownSelect } from "@/components/ui/DropdownSelect";
import { client } from "@/utils/amplify-utils";
import type { Schema } from "@/amplify/data/resource";
import Link from "next/link";

type SubmissionType = Schema["Submission"]["type"];
type SurveyType = Schema["Survey"]["type"];
type WorkspaceType = Schema["Workspace"]["type"];
type WorkspaceFilter = "all" | "unassigned" | string;

type SurveyMetrics = {
  surveyId: string;
  title: string;
  description?: string | null;
  workspaceId: string | null;
  workspaceName: string | null;
  isActive: boolean;
  totalSubmissions: number;
  lastResponseAt: Date | null;
};

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export default function SubmissionsPage() {
  const locale = useLocale();
  const { authStatus, user, signOut } = useAuthenticator();

  const [workspaceFilter, setWorkspaceFilter] = useState<WorkspaceFilter>("all");
  const [search, setSearch] = useState("");
  const [onlyWithResponses, setOnlyWithResponses] = useState(false);

  const [submissions, setSubmissions] = useState<SubmissionType[]>([]);
  const [surveys, setSurveys] = useState<SurveyType[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceType[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authStatus !== "authenticated") return;

    const subs = [
      client.models.Submission.observeQuery({ authMode: "apiKey" }).subscribe({
        next: ({ items }) => setSubmissions(items as SubmissionType[]),
      }),
      (client.models.Survey as any).observeQuery({ authMode: "userPool" }).subscribe({
        next: ({ items }: any) => setSurveys(items as SurveyType[]),
      }),
      client.models.Workspace.observeQuery().subscribe({
        next: ({ items }) => setWorkspaces(items as WorkspaceType[]),
      }),
    ];

    Promise.all([
      client.models.Submission.list({ authMode: "apiKey" }),
      client.models.Survey.list({ authMode: "userPool" }),
      client.models.Workspace.list(),
    ]).then(() => setLoading(false));

    return () => subs.forEach(sub => sub.unsubscribe());
  }, [authStatus]);

  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale || "es", { dateStyle: "medium", timeStyle: "short" }), [locale]);
  const formatDate = useCallback((value: Date | null) => value ? dateFormatter.format(value) : "--", [dateFormatter]);
  const formatNumber = useCallback((value: number) => new Intl.NumberFormat(locale || "es").format(value), [locale]);

  const surveyLookup = useMemo(() => new Map(surveys.map(s => [s.id, s])), [surveys]);
  const workspaceLookup = useMemo(() => new Map(workspaces.map(ws => [ws.id, ws.name || "Workspace"])), [workspaces]);

  const surveyMetrics = useMemo<SurveyMetrics[]>(() => {
    const grouped = submissions.reduce((acc, sub) => {
      const id = sub.surveyId as string | undefined;
      if (!id) return acc;
      if (!acc[id]) acc[id] = [];
      acc[id].push(sub);
      return acc;
    }, {} as Record<string, SubmissionType[]>);

    const allSurveyIds = new Set([...Object.keys(grouped), ...surveys.map(s => s.id as string)]);

    return Array.from(allSurveyIds).map(surveyId => {
      const survey = surveyLookup.get(surveyId);
      const subs = grouped[surveyId] ?? [];
      const lastResponseAt = subs.reduce((latest, sub) => {
        const current = toDate(sub.createdAt);
        return current && (!latest || current > latest) ? current : latest;
      }, null as Date | null);

      return {
        surveyId,
        title: survey?.title || "Encuesta sin titulo",
        description: survey?.description,
        workspaceId: (survey?.workspaceId as string) || null,
        workspaceName: survey?.workspaceId ? workspaceLookup.get(survey.workspaceId as string) || "Workspace" : null,
        isActive: survey?.isActive ?? true,
        totalSubmissions: subs.length,
        lastResponseAt,
      };
    }).sort((a, b) => (b.lastResponseAt?.getTime() || 0) - (a.lastResponseAt?.getTime() || 0));
  }, [submissions, surveys, surveyLookup, workspaceLookup]);

  const filteredMetrics = useMemo(() => {
    return surveyMetrics.filter(metric => {
      if (workspaceFilter !== "all" && metric.workspaceId !== workspaceFilter) return false;
      if (onlyWithResponses && metric.totalSubmissions === 0) return false;
      if (search.trim() && !metric.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [surveyMetrics, workspaceFilter, onlyWithResponses, search]);
  
  const userName = useMemo(() => user?.signInDetails?.loginId || (user as any)?.attributes?.email || user?.username || "", [user]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Navbar userName={userName} onSignOut={signOut} />
        <main className="mx-auto flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <header className="border-b border-slate-200 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resultados</p>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard de Encuestas</h1>
                <p className="text-sm text-slate-600">Revisa el rendimiento general y navega a los resultados detallados.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <DropdownSelect
                  value={workspaceFilter}
                  onChange={(val) => setWorkspaceFilter(val as WorkspaceFilter)}
                  options={[
                    { value: "all", label: "Todos los workspaces" },
                    ...workspaces.map((ws) => ({
                      value: ws.id as string,
                      label: ws.name || "Sin nombre",
                    })),
                  ]}
                  className="min-w-[200px]"
                />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={onlyWithResponses} onChange={(e) => setOnlyWithResponses(e.target.checked)} />
                  Solo con respuestas
                </label>
                <input type="search" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-56 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" />
              </div>
            </div>
          </header>

          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center"><LoadingSpinner /></div>
          ) : (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">Encuestas y Resultados</p>
                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">{formatNumber(filteredMetrics.length)} encuestas</span>
              </div>

              {!filteredMetrics.length ? (
                <div className="py-12 text-center text-slate-500"><p>No hay encuestas para este filtro.</p></div>
              ) : (
                <div className="divide-y divide-slate-100">
                  <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold uppercase text-slate-500">
                    <span className="col-span-5">Encuesta</span>
                    <span className="col-span-2">Respuestas</span>
                    <span className="col-span-3 text-right">Ultima respuesta</span>
                    <span className="col-span-2 text-right">Acciones</span>
                  </div>
                  {filteredMetrics.map((metric) => (
                    <div key={metric.surveyId} className="grid grid-cols-12 gap-4 px-4 py-4 items-center">
                      <div className="col-span-5">
                        <p className="font-semibold text-slate-900">{metric.title}</p>
                        <p className="text-xs text-slate-500">{metric.workspaceName || "Sin workspace"}</p>
                      </div>
                      <div className="col-span-2 font-bold text-slate-900">{formatNumber(metric.totalSubmissions)}</div>
                      <div className="col-span-3 text-right text-sm font-semibold text-slate-800">{formatDate(metric.lastResponseAt)}</div>
                      <div className="col-span-2 text-right">
                        <Link href={`/${locale}/submissions/${metric.surveyId}`} className="text-sm font-semibold text-slate-700 hover:underline">
                          Ver detalles
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}

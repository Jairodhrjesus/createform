"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useLocale } from "next-intl";
import AuthGuard from "@/components/AuthGuard";
import Navbar from "@/components/layout/Navbar";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { client } from "@/utils/amplify-utils";
import type { Schema } from "@/amplify/data/resource";

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
  averageScore: number;
  averageAnswered: number;
  uniqueRespondents: number;
  lastResponseAt: Date | null;
  topOutcomeTitle: string | null;
  topOutcomePercent: number;
};

const countAnswers = (answersContent: SubmissionType["answersContent"]): number => {
  if (!answersContent) return 0;
  if (typeof answersContent === "string") {
    try {
      const parsed = JSON.parse(answersContent);
      if (parsed && typeof parsed === "object") {
        return Object.keys(parsed as Record<string, unknown>).length;
      }
    } catch (err) {
      console.error("No se pudo parsear answersContent:", err);
      return 0;
    }
  }
  if (typeof answersContent === "object") {
    return Object.keys(answersContent as Record<string, unknown>).length;
  }
  return 0;
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
  const [preferredAuthMode] = useState<"userPool" | "apiKey">("apiKey");

  const [submissions, setSubmissions] = useState<SubmissionType[]>([]);
  const [surveys, setSurveys] = useState<SurveyType[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceType[]>([]);

  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [loadingSurveys, setLoadingSurveys] = useState(true);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);

  const workspaceModel = (client as any)?.models?.Workspace;
  const hasWorkspaceModel = Boolean(workspaceModel?.observeQuery);

  useEffect(() => {
    if (!hasWorkspaceModel) {
      setLoadingWorkspaces(false);
    }
  }, [hasWorkspaceModel]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("resultsWorkspaceFilter");
    if (stored) {
      setWorkspaceFilter(stored as WorkspaceFilter);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("resultsWorkspaceFilter", workspaceFilter);
  }, [workspaceFilter]);

  useEffect(() => {
    if (!hasWorkspaceModel) return;
    if (workspaceFilter === "all" || workspaceFilter === "unassigned") return;
    if (workspaces.length === 0) return;
    const exists = workspaces.some((ws) => (ws.id as string) === workspaceFilter);
    if (!exists) {
      setWorkspaceFilter(workspaces[0].id as string);
    }
  }, [workspaceFilter, workspaces, hasWorkspaceModel]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;

    const fetchAllSubmissions = async () => {
      try {
        let nextToken: string | null | undefined = null;
        const all: SubmissionType[] = [];
        do {
          const { data, nextToken: token } = await client.models.Submission.list({
            nextToken,
            authMode: preferredAuthMode,
          });
          if (data) all.push(...(data as SubmissionType[]));
          nextToken = token as string | null | undefined;
        } while (nextToken);
        setSubmissions(all);
        setLoadingSubmissions(false);
      } catch (err) {
        console.error("Error cargando submissions (list):", err);
        setLoadingSubmissions(false);
      }
    };

    void fetchAllSubmissions();

    const submissionsSub = client.models.Submission.observeQuery({
      authMode: preferredAuthMode,
    }).subscribe({
      next: ({ items }) => {
        setSubmissions(items as SubmissionType[]);
        setLoadingSubmissions(false);
      },
      error: (err) => {
        console.error("Error cargando submissions (subscription):", err);
        setLoadingSubmissions(false);
      },
    });

    const surveysSub = (client.models.Survey as any)
      .observeQuery(
        {
          selectionSet: [
            "id",
            "title",
            "description",
            "workspaceId",
            "isActive",
            "createdAt",
            "updatedAt",
            "leadCaptureTitle",
            "leadCaptureSubtitle",
            "leadCaptureCtaLabel",
            "leadCaptureDisclaimer",
            "leadCaptureCollectName",
            "leadCaptureRequireName",
            "leadCaptureCollectEmail",
            "leadCaptureRequireEmail",
          ],
        },
        { authMode: "userPool" }
      )
      .subscribe({
        next: ({ items }) => {
          setSurveys(items as SurveyType[]);
          setLoadingSurveys(false);
        },
        error: (err: any) => {
          console.error("Error cargando encuestas:", err);
          setLoadingSurveys(false);
        },
      });

    let workspaceSub: { unsubscribe: () => void } | undefined;
    if (hasWorkspaceModel) {
      workspaceSub = workspaceModel.observeQuery().subscribe({
        next: ({ items }: any) => {
          setWorkspaces(items as WorkspaceType[]);
          setLoadingWorkspaces(false);
        },
        error: (err: any) => {
          console.error("Error cargando workspaces:", err);
          setLoadingWorkspaces(false);
        },
      });
    }

    return () => {
      submissionsSub.unsubscribe();
      surveysSub.unsubscribe();
      workspaceSub?.unsubscribe();
    };
  }, [authStatus, hasWorkspaceModel, preferredAuthMode, workspaceModel]);

  const dateFormatter = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(locale || "es", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return new Intl.DateTimeFormat("es", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    }
  }, [locale]);

  const formatDate = useCallback(
    (value: Date | null) => {
      if (!value) return "--";
      return dateFormatter.format(value);
    },
    [dateFormatter]
  );

  const formatNumber = useCallback(
    (value: number) => {
      try {
        return new Intl.NumberFormat(locale || "es").format(value);
      } catch {
        return value.toString();
      }
    },
    [locale]
  );

  const surveyLookup = useMemo(() => {
    const map: Record<string, SurveyType> = {};
    surveys.forEach((s) => {
      if (s.id) {
        map[s.id as string] = s;
      }
    });
    return map;
  }, [surveys]);

  const workspaceLookup = useMemo(() => {
    const map: Record<string, string> = {};
    workspaces.forEach((ws) => {
      if (ws.id) {
        map[ws.id as string] = ws.name || "Workspace";
      }
    });
    return map;
  }, [workspaces]);

  const surveyMetrics = useMemo<SurveyMetrics[]>(() => {
    const grouped: Record<string, SubmissionType[]> = {};
    submissions.forEach((sub) => {
      const id = sub.surveyId as string | undefined;
      if (!id) return;
      if (!grouped[id]) grouped[id] = [];
      grouped[id].push(sub);
    });

    const ids = new Set<string>();
    Object.keys(grouped).forEach((id) => ids.add(id));
    surveys.forEach((s) => {
      if (s.id) ids.add(s.id as string);
    });

    const list: SurveyMetrics[] = [];
    ids.forEach((surveyId) => {
      const survey = surveyLookup[surveyId];
      const subs = grouped[surveyId] ?? [];
      const totalSubmissions = subs.length;
      const totalScore = subs.reduce((sum, sub) => sum + (sub.totalScore || 0), 0);
      const averageScore = totalSubmissions ? totalScore / totalSubmissions : 0;
      const answeredCount = subs.reduce(
        (sum, sub) => sum + countAnswers(sub.answersContent),
        0
      );
      const averageAnswered = totalSubmissions ? answeredCount / totalSubmissions : 0;

      const respondentIds = new Set<string>();
      subs.forEach((sub) => {
        const respondent = sub.respondentId ? String(sub.respondentId) : `submission-${sub.id}`;
        respondentIds.add(respondent);
      });

      let lastResponseAt: Date | null = null;
      subs.forEach((sub) => {
        const parsed = toDate(sub.createdAt);
        if (parsed && (!lastResponseAt || parsed > lastResponseAt)) {
          lastResponseAt = parsed;
        }
      });

      const outcomeCounts: Record<string, number> = {};
      subs.forEach((sub) => {
        const key = sub.outcomeTitle || "Sin resultado";
        outcomeCounts[key] = (outcomeCounts[key] || 0) + 1;
      });

      const topOutcomeEntry =
        totalSubmissions > 0
          ? Object.entries(outcomeCounts).sort((a, b) => b[1] - a[1])[0]
          : null;

      list.push({
        surveyId,
        title: survey?.title || "Encuesta sin titulo",
        description: survey?.description,
        workspaceId: (survey?.workspaceId as string) || null,
        workspaceName:
          survey?.workspaceId && workspaceLookup[survey.workspaceId as string]
            ? workspaceLookup[survey.workspaceId as string]
            : survey?.workspaceId
            ? "Workspace"
            : null,
        isActive: survey?.isActive ?? true,
        totalSubmissions,
        averageScore: Number(averageScore.toFixed(1)),
        averageAnswered: Number(averageAnswered.toFixed(1)),
        uniqueRespondents: respondentIds.size,
        lastResponseAt,
        topOutcomeTitle: topOutcomeEntry ? topOutcomeEntry[0] : null,
        topOutcomePercent:
          topOutcomeEntry && totalSubmissions
            ? Math.round((topOutcomeEntry[1] / totalSubmissions) * 100)
            : 0,
      });
    });

    return list.sort((a, b) => {
      const aTime = a.lastResponseAt ? a.lastResponseAt.getTime() : 0;
      const bTime = b.lastResponseAt ? b.lastResponseAt.getTime() : 0;
      return bTime - aTime;
    });
  }, [submissions, surveys, surveyLookup, workspaceLookup]);

  const filteredMetrics = useMemo(() => {
    const byWorkspace = hasWorkspaceModel
      ? surveyMetrics.filter((metric) => {
          if (workspaceFilter === "all") return true;
          if (workspaceFilter === "unassigned") return !metric.workspaceId;
          return metric.workspaceId === workspaceFilter;
        })
      : surveyMetrics;

    const byResponses = onlyWithResponses
      ? byWorkspace.filter((metric) => metric.totalSubmissions > 0)
      : byWorkspace;

    const bySearch = search.trim()
      ? byResponses.filter((metric) => {
          const term = search.toLowerCase();
          return (
            metric.title.toLowerCase().includes(term) ||
            (metric.description || "").toLowerCase().includes(term)
          );
        })
      : byResponses;

    return bySearch;
  }, [surveyMetrics, workspaceFilter, hasWorkspaceModel, onlyWithResponses, search]);

  const filteredSubmissions = useMemo(() => {
    const allowed = new Set(filteredMetrics.map((m) => m.surveyId));
    return submissions.filter((sub) => allowed.has(sub.surveyId as string));
  }, [filteredMetrics, submissions]);

  const leadsWithEmail = useMemo(
    () => filteredSubmissions.filter((sub) => Boolean(sub.respondentEmail)).length,
    [filteredSubmissions]
  );

  const overallAverageScore = useMemo(() => {
    if (filteredSubmissions.length === 0) return 0;
    const total = filteredSubmissions.reduce((sum, sub) => sum + (sub.totalScore || 0), 0);
    return Number((total / filteredSubmissions.length).toFixed(1));
  }, [filteredSubmissions]);

  const topOutcomeOverall = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredSubmissions.forEach((sub) => {
      const key = sub.outcomeTitle || "Sin resultado";
      counts[key] = (counts[key] || 0) + 1;
    });
    const entries = Object.entries(counts);
    if (entries.length === 0) return null;
    const [title, count] = entries.sort((a, b) => b[1] - a[1])[0];
    return {
      title,
      percent: Math.round((count / filteredSubmissions.length) * 100),
    };
  }, [filteredSubmissions]);

  const totalUniqueRespondents = useMemo(() => {
    const ids = new Set<string>();
    filteredSubmissions.forEach((sub) => {
      ids.add(sub.respondentId ? String(sub.respondentId) : `submission-${sub.id}`);
    });
    return ids.size;
  }, [filteredSubmissions]);

  const recentLeads = useMemo(() => {
    return filteredSubmissions
      .filter((sub) => sub.respondentEmail)
      .sort((a, b) => {
        const aTime = toDate(a.createdAt)?.getTime() || 0;
        const bTime = toDate(b.createdAt)?.getTime() || 0;
        return bTime - aTime;
      })
      .slice(0, 8)
      .map((sub) => ({
        id: sub.id as string,
        name: sub.respondentName || "Lead sin nombre",
        email: sub.respondentEmail as string,
        outcome: sub.outcomeTitle || "Sin resultado",
        score: sub.totalScore || 0,
        surveyTitle: surveyLookup[sub.surveyId as string]?.title || "Encuesta",
        createdAt: toDate(sub.createdAt),
      }));
  }, [filteredSubmissions, surveyLookup]);

  const isLoading = loadingSubmissions || loadingSurveys || loadingWorkspaces;
  const hasData = filteredMetrics.length > 0;
  const userName = useMemo(() => {
    return (
      user?.signInDetails?.loginId ||
      (user as any)?.attributes?.preferred_username ||
      (user as any)?.attributes?.email ||
      user?.username ||
      ""
    );
  }, [user]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Navbar userName={userName} onSignOut={signOut} />

        <main className="mx-auto flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-3 border-b border-slate-200 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Resultados
                </p>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  Dashboard de encuestas
                </h1>
                <p className="text-sm text-slate-600">
                  Revisa el rendimiento de cada encuesta y filtra por workspace.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {hasWorkspaceModel && (
                  <select
                    value={workspaceFilter}
                    onChange={(event) => setWorkspaceFilter(event.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
                  >
                    <option value="all">Todos los workspaces</option>
                    {workspaces.map((ws) => (
                      <option key={ws.id} value={ws.id as string}>
                        {ws.name || "Workspace sin nombre"}
                      </option>
                    ))}
                    <option value="unassigned">Sin workspace</option>
                  </select>
                )}
                <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm">
                  <input
                    type="checkbox"
                    checked={onlyWithResponses}
                    onChange={(event) => setOnlyWithResponses(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                  />
                  Solo con respuestas
                </label>
                <input
                  type="search"
                  placeholder="Buscar encuesta"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-56 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
                />
              </div>
            </div>
          </header>

          {isLoading ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60">
              <div className="flex items-center gap-3 text-slate-600">
                <LoadingSpinner />
                <span>Cargando resultados...</span>
              </div>
            </div>
          ) : (
            <>
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Total respuestas
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {formatNumber(filteredSubmissions.length)}
                  </p>
                  <p className="text-xs text-slate-500">
                    En {filteredMetrics.length} encuestas visibles
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Promedio de score
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {overallAverageScore.toFixed(1)}
                  </p>
                  <p className="text-xs text-slate-500">Sobre todas las respuestas filtradas</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Leads con email
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {formatNumber(leadsWithEmail)}
                  </p>
                  <p className="text-xs text-slate-500">Capturados via email gate</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Resultado principal
                  </p>
                  {topOutcomeOverall ? (
                    <div className="mt-2">
                      <p className="text-lg font-semibold text-slate-900">
                        {topOutcomeOverall.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {topOutcomeOverall.percent}% de las respuestas
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-lg font-semibold text-slate-400">Sin datos</p>
                  )}
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Respondentes unicos
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {formatNumber(totalUniqueRespondents)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Basado en respondentId cuando existe
                  </p>
                </div>
              </section>

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Leads recientes</p>
                    <p className="text-xs text-slate-500">
                      Muestra nombre y email capturado en la puerta de resultado.
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {formatNumber(recentLeads.length)} visibles
                  </span>
                </div>

                {recentLeads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 px-8 py-10 text-center text-slate-500">
                    <p className="text-sm font-semibold text-slate-700">
                      Aun no hay leads con email capturado.
                    </p>
                    <p className="text-xs text-slate-500">
                      Cuando los encuestados completen la puerta de email, veras sus datos aqui.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    <div className="grid grid-cols-12 gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <span className="col-span-3 sm:col-span-2">Lead</span>
                      <span className="col-span-4 sm:col-span-3">Email</span>
                      <span className="col-span-3 sm:col-span-3">Encuesta</span>
                      <span className="col-span-2 sm:col-span-2">Resultado</span>
                      <span className="col-span-2 sm:col-span-2 text-right">Fecha</span>
                    </div>
                    {recentLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="grid grid-cols-12 gap-3 px-4 py-3 text-sm transition hover:bg-slate-50"
                      >
                        <div className="col-span-3 sm:col-span-2">
                          <p className="font-semibold text-slate-900">{lead.name}</p>
                          <p className="text-xs text-slate-500">Score: {lead.score}</p>
                        </div>
                        <div className="col-span-4 sm:col-span-3">
                          <a
                            href={`mailto:${lead.email}`}
                            className="text-slate-800 underline-offset-2 hover:underline"
                          >
                            {lead.email}
                          </a>
                        </div>
                        <div className="col-span-3 sm:col-span-3">
                          <p className="font-semibold text-slate-900 line-clamp-1">
                            {lead.surveyTitle}
                          </p>
                        </div>
                        <div className="col-span-2 sm:col-span-2">
                          <p className="text-sm font-semibold text-slate-900 line-clamp-1">
                            {lead.outcome}
                          </p>
                        </div>
                        <div className="col-span-2 sm:col-span-2 text-right">
                          <p className="text-sm font-semibold text-slate-900">
                            {formatDate(lead.createdAt)}
                          </p>
                          <p className="text-xs text-slate-500">Ultima respuesta</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Encuestas y resultados
                    </p>
                    <p className="text-xs text-slate-500">
                      Vista general por encuesta. Ordenadas por actividad reciente.
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                    {formatNumber(filteredMetrics.length)} encuestas
                  </span>
                </div>

                {!hasData ? (
                  <div className="flex flex-col items-center justify-center gap-2 px-8 py-12 text-center text-slate-500">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-slate-200 text-xl font-bold text-slate-300">
                      i
                    </div>
                    <p className="text-sm font-semibold text-slate-700">
                      No hay respuestas para este filtro.
                    </p>
                    <p className="text-xs text-slate-500">
                      Ajusta el workspace, desmarca "Solo con respuestas" o limpia la busqueda.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <span className="col-span-5 sm:col-span-4">Encuesta</span>
                      <span className="col-span-3 sm:col-span-2">Respuestas</span>
                      <span className="col-span-2 sm:col-span-2">Score</span>
                      <span className="col-span-2 sm:col-span-2">Resultado</span>
                      <span className="col-span-12 sm:col-span-2 text-right">Ultima respuesta</span>
                    </div>
                    {filteredMetrics.map((metric) => (
                      <div
                        key={metric.surveyId}
                        className="grid grid-cols-12 gap-4 px-4 py-4 transition hover:bg-slate-50"
                      >
                        <div className="col-span-12 sm:col-span-4">
                          <p className="text-sm font-semibold text-slate-900">{metric.title}</p>
                          <p className="text-xs text-slate-500 line-clamp-2">
                            {metric.description || "Sin descripcion"}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <span
                              className={`rounded-full px-2 py-1 font-semibold ${
                                metric.isActive
                                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                                  : "bg-amber-50 text-amber-700 ring-1 ring-amber-100"
                              }`}
                            >
                              {metric.isActive ? "Activa" : "Pausada"}
                            </span>
                            {metric.workspaceName && (
                              <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700 ring-1 ring-slate-200">
                                {metric.workspaceName}
                              </span>
                            )}
                            {!metric.workspaceName && hasWorkspaceModel && (
                              <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600 ring-1 ring-slate-200">
                                Sin workspace
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="col-span-6 sm:col-span-2">
                          <p className="text-lg font-bold text-slate-900">
                            {formatNumber(metric.totalSubmissions)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatNumber(metric.uniqueRespondents)} respondentes
                          </p>
                        </div>

                        <div className="col-span-6 sm:col-span-2">
                          <p className="text-lg font-bold text-slate-900">
                            {metric.averageScore.toFixed(1)} pts
                          </p>
                          <p className="text-xs text-slate-500">
                            {metric.averageAnswered.toFixed(1)} preguntas respondidas en promedio
                          </p>
                        </div>

                        <div className="col-span-6 sm:col-span-2">
                          {metric.topOutcomeTitle ? (
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {metric.topOutcomeTitle}
                              </p>
                              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                                <div className="h-2 flex-1 rounded-full bg-slate-200">
                                  <div
                                    className="h-2 rounded-full bg-slate-900"
                                    style={{ width: `${metric.topOutcomePercent}%` }}
                                  />
                                </div>
                                <span className="font-semibold">
                                  {metric.topOutcomePercent}%
                                </span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm font-semibold text-slate-400">Sin datos</p>
                          )}
                        </div>

                        <div className="col-span-6 sm:col-span-2 text-right text-sm font-semibold text-slate-800">
                          {formatDate(metric.lastResponseAt)}
                          <p className="text-xs text-slate-500">Ultima respuesta</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}

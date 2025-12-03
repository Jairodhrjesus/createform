"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { client } from "@/utils/amplify-utils";
import type { Schema } from "@/amplify/data/resource";

type SurveyType = Schema["Survey"]["type"];
type WorkspaceType = Schema["Workspace"]["type"];
type WorkspaceFilter = string | "all" | "unassigned";

export default function Dashboard() {
  const [surveys, setSurveys] = useState<SurveyType[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceType[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<WorkspaceFilter>(() => {
    if (typeof window === "undefined") return "all";
    return (window.localStorage.getItem("activeWorkspaceId") as WorkspaceFilter) || "all";
  });
  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [creatingDefaultWorkspace, setCreatingDefaultWorkspace] = useState(false);
  const locale = useLocale();
  const workspaceModel = (client as any)?.models?.Workspace;
  const hasWorkspaceModel = Boolean(workspaceModel?.observeQuery);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("activeWorkspaceId", activeWorkspaceId);
  }, [activeWorkspaceId]);

  const ensureDefaultWorkspace = useCallback(async () => {
    if (!hasWorkspaceModel || !workspaceModel?.create) return;
    if (creatingDefaultWorkspace) return;
    setCreatingDefaultWorkspace(true);
    try {
      const { errors } = await workspaceModel.create({
        name: "Mi workspace",
        description: "Espacio inicial",
        isDefault: true,
      } as unknown as Schema["Workspace"]["createType"]);

      if (errors) {
        console.error("No se pudo crear el workspace por defecto:", errors);
      }
    } catch (err) {
      console.error("No se pudo crear el workspace por defecto:", err);
    } finally {
      setCreatingDefaultWorkspace(false);
    }
  }, [creatingDefaultWorkspace, hasWorkspaceModel, workspaceModel]);

  useEffect(() => {
    if (!hasWorkspaceModel || !workspaceModel?.observeQuery) return;
    const subscription = workspaceModel.observeQuery().subscribe({
      next: ({ items }) => {
        const sorted = items
          .slice()
          .sort((a, b) => {
            if (a.isDefault === b.isDefault) {
              return (a.name || "").localeCompare(b.name || "");
            }
            return a.isDefault ? -1 : 1;
          });

        if (sorted.length === 0) {
          void ensureDefaultWorkspace();
        }

        setWorkspaces(sorted);

        if (
          activeWorkspaceId !== "all" &&
          activeWorkspaceId !== "unassigned" &&
          sorted.length > 0
        ) {
          const exists = sorted.some((ws) => ws.id === activeWorkspaceId);
          if (!exists) {
            const fallback = (sorted.find((ws) => ws.isDefault) ?? sorted[0])?.id;
            if (fallback) setActiveWorkspaceId(fallback as string);
          }
        }
      },
      error: (err) => console.error("Error observando workspaces:", err),
    });

    return () => subscription.unsubscribe();
  }, [activeWorkspaceId, ensureDefaultWorkspace, hasWorkspaceModel, workspaceModel]);

  useEffect(() => {
    const subscription = client.models.Survey.observeQuery().subscribe({
      next: ({ items }) => setSurveys([...items]),
    });
    return () => subscription.unsubscribe();
  }, []);

  const workspaceSurveyCounts = useMemo(() => {
    if (!hasWorkspaceModel) return {};
    const counts: Record<string, number> = {};
    surveys.forEach((s) => {
      const key = (s.workspaceId as string) || "unassigned";
      counts[key] = (counts[key] ?? 0) + 1;
    });
    return counts;
  }, [surveys, hasWorkspaceModel]);

  const hasUnassigned = hasWorkspaceModel && workspaceSurveyCounts["unassigned"] > 0;

  const activeWorkspaceName = useMemo(() => {
    if (!hasWorkspaceModel) return "Mis formularios";
    if (activeWorkspaceId === "all") return "Todos los workspaces";
    if (activeWorkspaceId === "unassigned") return "Sin workspace";
    return workspaces.find((w) => w.id === activeWorkspaceId)?.name || "Workspace";
  }, [activeWorkspaceId, workspaces, hasWorkspaceModel]);

  const filteredSurveys = useMemo(() => {
    const byWorkspace = hasWorkspaceModel
      ? surveys.filter((s) => {
          if (activeWorkspaceId === "all") return true;
          if (activeWorkspaceId === "unassigned") return !s.workspaceId;
          return s.workspaceId === activeWorkspaceId;
        })
      : surveys;

    if (!search.trim()) return byWorkspace;
    const q = search.toLowerCase();
    return byWorkspace.filter((s) => s.title?.toLowerCase().includes(q));
  }, [surveys, search, activeWorkspaceId, hasWorkspaceModel]);

  const resolveWorkspaceId = useCallback(
    (fallback?: string | null) => {
      if (!hasWorkspaceModel) return fallback ?? null;
      if (activeWorkspaceId !== "all" && activeWorkspaceId !== "unassigned") {
        return activeWorkspaceId;
      }
      if (fallback) return fallback;
      const ws = workspaces.find((w) => w.isDefault) ?? workspaces[0];
      return (ws?.id as string) || null;
    },
    [activeWorkspaceId, workspaces, hasWorkspaceModel]
  );

  const handleCreateWorkspace = async () => {
    if (!hasWorkspaceModel || !workspaceModel?.create) {
      alert("Necesitas actualizar el backend (amplify push) para habilitar workspaces.");
      return;
    }
    const name = window.prompt("Nombre del nuevo workspace:");
    if (!name?.trim()) return;

    const payload = {
      name: name.trim(),
      description: "Espacio de trabajo",
      isDefault: workspaces.length === 0,
    };
    const { data, errors } = await workspaceModel.create(
      payload as unknown as Schema["Workspace"]["createType"]
    );

    if (errors) {
      console.error(errors);
      alert("Error al crear el workspace");
      return;
    }

    if (data?.id) {
      setActiveWorkspaceId(data.id as string);
    }
  };

  const handleCreateSurvey = async () => {
    const title = window.prompt("Como se llamara tu nueva encuesta?");
    if (!title) return;

    const workspaceId = resolveWorkspaceId(null);

    const payload: Record<string, unknown> = {
      title,
      description: "Borrador inicial",
      isActive: true,
    };

    if (hasWorkspaceModel && workspaceId) {
      payload.workspaceId = workspaceId;
    } else if (hasWorkspaceModel && !workspaceId) {
      alert("Crea primero un workspace para alojar tus formularios.");
      return;
    }

    const { errors } = await client.models.Survey.create(
      payload as unknown as Schema["Survey"]["createType"]
    );

    if (errors) {
      console.error(errors);
      alert("Error al crear la encuesta");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Seguro que quieres borrarla?")) return;
    await client.models.Survey.delete({ id });
    setOpenMenuId(null);
  };

  const handleToggleActive = async (survey: SurveyType) => {
    try {
      await client.models.Survey.update({
        id: survey.id as string,
        isActive: !survey.isActive,
      } as unknown as Schema["Survey"]["updateType"]);
    } catch (err) {
      console.error("No se pudo cambiar el estado:", err);
      alert("No se pudo cambiar el estado. Intenta de nuevo.");
    } finally {
      setOpenMenuId(null);
    }
  };

  const handleDuplicate = async (survey: SurveyType) => {
    try {
      const newTitle = `${survey.title || "Sin titulo"} (copia)`;
      const targetWorkspaceId = resolveWorkspaceId(survey.workspaceId as string);
      const payload: Record<string, unknown> = {
        title: newTitle,
        description: survey.description || "Borrador inicial",
        isActive: false,
      };
      if (hasWorkspaceModel) {
        payload.workspaceId = targetWorkspaceId || undefined;
      }
      await client.models.Survey.create(
        payload as unknown as Schema["Survey"]["createType"]
      );
    } catch (err) {
      console.error("Error duplicando encuesta:", err);
      alert("No se pudo duplicar. Intenta de nuevo.");
    } finally {
      setOpenMenuId(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("No se pudo copiar:", err);
      window.prompt("Copia manualmente:", text);
    }
  };

  const handleShare = (surveyId: string) => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL || "";
    const link = `${origin}/${locale}/embed/${surveyId}`;
    copyToClipboard(link);
    setOpenMenuId(null);
  };

  const handleCopyId = (surveyId: string) => {
    copyToClipboard(surveyId);
    setOpenMenuId(null);
  };

  const handleMoveSurvey = async (surveyId: string, workspaceId: string) => {
    if (!hasWorkspaceModel) {
      alert("Actualiza el backend (amplify push) para usar workspaces.");
      return;
    }
    try {
      await client.models.Survey.update({
        id: surveyId,
        workspaceId,
      } as unknown as Schema["Survey"]["updateType"]);
      if (activeWorkspaceId === "unassigned") {
        setActiveWorkspaceId(workspaceId);
      }
    } catch (err) {
      console.error("No se pudo mover la encuesta:", err);
      alert("No se pudo mover la encuesta. Intenta de nuevo.");
    } finally {
      setOpenMenuId(null);
    }
  };

  useEffect(() => {
    const closeOnOutside = () => setOpenMenuId(null);
    window.addEventListener("click", closeOnOutside);
    return () => window.removeEventListener("click", closeOnOutside);
  }, []);

  return (
    <div className="w-full h-auto lg:h-full overflow-visible lg:overflow-hidden bg-slate-50">
      <div className="flex w-full h-auto lg:h-full lg:min-h-0 max-w-full flex-col px-4 py-4 sm:px-6 lg:px-8">
        {/* Top header */}
        <header className="mb-4 flex flex-col gap-4 sm:mb-6 sm:h-[10vh] sm:min-h-[84px] sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Workspace
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">
              Mis formularios
            </h1>
            <p className="text-sm text-slate-500">
              Gestiona tus encuestas por workspace. Activo:{" "}
              <span className="font-semibold text-slate-900">{activeWorkspaceName}</span>
            </p>
          </div>

          <button
            onClick={handleCreateSurvey}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 sm:w-auto"
          >
            <span className="text-lg leading-none">+</span>
            Crear nuevo formulario
          </button>
        </header>

        <div className="grid w-full gap-6 overflow-visible lg:flex-1 lg:min-h-0 lg:overflow-hidden lg:grid-cols-[260px,1fr]">
          {/* Sidebar */}
          <aside className="flex h-full min-h-0 flex-col gap-4 rounded-2xl border border-slate-200 bg-white/70 p-4 backdrop-blur-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Busqueda
              </p>
              <div className="relative mt-2">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar formulario"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-slate-900/80"
                />
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Espacios de trabajo
                </p>
                {hasWorkspaceModel && (
                  <button
                    onClick={handleCreateWorkspace}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    title="Crear workspace"
                  >
                    +
                  </button>
                )}
              </div>
              <div className="mt-1 flex flex-col gap-1 text-sm">
                {hasWorkspaceModel ? (
                  <>
                    <button
                      onClick={() => setActiveWorkspaceId("all")}
                      className={`flex items-center justify-between rounded-xl border px-3 py-2 transition ${
                        activeWorkspaceId === "all"
                          ? "border-slate-900/10 bg-slate-900 text-white"
                          : "border-slate-900/10 bg-white text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <span className="truncate">Todos los workspaces</span>
                      <span className="rounded-full bg-white/10 px-2 text-xs">
                        {surveys.length}
                      </span>
                    </button>
                    {workspaces.map((ws) => (
                      <button
                        key={ws.id}
                        onClick={() => setActiveWorkspaceId(ws.id as string)}
                        className={`flex items-center justify-between rounded-xl border px-3 py-2 transition ${
                          activeWorkspaceId === ws.id
                            ? "border-slate-900/10 bg-slate-900 text-white"
                            : "border-slate-900/10 bg-white text-slate-900 hover:bg-slate-50"
                        }`}
                      >
                        <span className="truncate">
                          {ws.name || "Sin nombre"}
                          {ws.isDefault ? " (default)" : ""}
                        </span>
                        <span className="rounded-full bg-white/10 px-2 text-xs">
                          {workspaceSurveyCounts[ws.id as string] ?? 0}
                        </span>
                      </button>
                    ))}
                    {hasUnassigned && (
                      <button
                        onClick={() => setActiveWorkspaceId("unassigned")}
                        className={`flex items-center justify-between rounded-xl border px-3 py-2 transition ${
                          activeWorkspaceId === "unassigned"
                            ? "border-slate-900/10 bg-slate-900 text-white"
                            : "border-slate-900/10 bg-white text-slate-900 hover:bg-slate-50"
                        }`}
                      >
                        <span className="truncate">Sin workspace</span>
                        <span className="rounded-full bg-white/10 px-2 text-xs">
                          {workspaceSurveyCounts["unassigned"] ?? 0}
                        </span>
                      </button>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-slate-500">
                    Workspaces no disponibles hasta actualizar el backend (amplify push).
                  </p>
                )}
              </div>
            </div>

            <div className="mt-auto rounded-xl bg-slate-900/5 px-3 py-3 text-xs text-slate-500">
              <p className="mb-1 font-medium text-slate-700">Resumen rapido</p>
              <p>
                Formularios visibles:{" "}
                <span className="font-semibold text-slate-900">
                  {filteredSurveys.length}
                </span>
              </p>
            </div>
          </aside>

          {/* Main content */}
          <section className="flex flex-col sm:min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
                  F
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Formularios en "{activeWorkspaceName}"
                  </p>
                  <p className="text-xs text-slate-500">
                    {filteredSurveys.length} elemento
                    {filteredSurveys.length === 1 ? "" : "s"} encontrados
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50">
                  Ordenar por: reciente
                </button>
                <div className="flex rounded-full border border-slate-200 bg-slate-50 p-1">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                      viewMode === "list"
                        ? "bg-white text-slate-800 shadow"
                        : "text-slate-400"
                    }`}
                  >
                    Lista
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                      viewMode === "grid"
                        ? "bg-white text-slate-800 shadow"
                        : "text-slate-400"
                    }`}
                  >
                    Cuadricula
                  </button>
                </div>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
              {/* Empty state / table */}
              {filteredSurveys.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-8 text-center">
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border border-dashed border-slate-300 text-slate-400">
                    +
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    Aun no tienes formularios
                  </p>
                  <p className="text-xs text-slate-500">
                    Crea tu primer formulario para comenzar a recopilar
                    respuestas.
                  </p>
                  <button
                    onClick={handleCreateSurvey}
                    className="mt-4 inline-flex items-center gap-1 rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
                  >
                    Crear formulario
                  </button>
                </div>
              ) : (
                viewMode === "list" ? (
                  <div className="flex-1 overflow-x-auto overflow-y-auto">
                    <table className="min-w-full border-separate border-spacing-y-1 px-4 py-4 sm:px-6">
                      <thead>
                        <tr className="text-left text-xs text-slate-500">
                          <th className="px-3 py-2 font-medium">Nombre</th>
                          <th className="px-3 py-2 font-medium">Respuestas</th>
                          <th className="px-3 py-2 font-medium">Estado</th>
                          <th className="px-3 py-2 font-medium">Actualizado</th>
                          <th className="px-3 py-2 font-medium text-right">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSurveys.map((survey) => (
                          <tr
                            key={survey.id}
                            className="align-middle text-sm text-slate-800"
                          >
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-3">
                                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900/5 text-xs font-semibold text-slate-700">
                                  {survey.title?.charAt(0).toUpperCase() || "F"}
                                </span>
                                <div>
                                  <Link
                                    href={`/${locale}/surveys/${survey.id}`}
                                    className="font-medium text-slate-900 hover:underline"
                                  >
                                    {survey.title || "Sin titulo"}
                                  </Link>
                                  <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5">
                                      {workspaces.find((w) => w.id === survey.workspaceId)?.name ||
                                        "Sin workspace"}
                                    </span>
                                    <button
                                      onClick={() => handleShare(survey.id as string)}
                                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 font-medium text-slate-700 hover:bg-slate-50"
                                    >
                                      Compartir
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="px-3 py-2 text-xs text-slate-500">
                              {/* Sustituye "-" por el conteo real si lo tienes en el modelo */}
                              -
                            </td>

                            <td className="px-3 py-2 text-xs">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${
                                  survey.isActive
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-50 text-slate-500"
                                }`}
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                {survey.isActive ? "Activo" : "Borrador"}
                              </span>
                            </td>

                            <td className="px-3 py-2 text-xs text-slate-500">
                              {/* Si tu modelo tiene `updatedAt`, usalo aqui */}
                              --
                            </td>

                            <td className="relative px-3 py-2 text-xs">
                              <div className="flex justify-end gap-2">
                                <Link
                                  href={`/${locale}/surveys/${survey.id}`}
                                  className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                                >
                                  Editar
                                </Link>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(
                                      openMenuId === survey.id ? null : (survey.id as string)
                                    );
                                  }}
                                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                                >
                                  ...
                                </button>
                              </div>
                              {openMenuId === survey.id && (
                                <div
                                  className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() => handleShare(survey.id as string)}
                                    className="flex w-full items-center px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                                  >
                                    Copiar link
                                  </button>
                                  <button
                                    onClick={() => handleCopyId(survey.id as string)}
                                    className="flex w-full items-center px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                                  >
                                    Copiar ID
                                  </button>
                                  <button
                                    onClick={() => handleToggleActive(survey)}
                                    className="flex w-full items-center px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                                  >
                                    {survey.isActive ? "Desactivar" : "Publicar"}
                                  </button>
                                  <button
                                    onClick={() => handleDuplicate(survey)}
                                    className="flex w-full items-center px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                                  >
                                    Duplicar
                                  </button>
                                  <Link
                                    href={`/${locale}/surveys/${survey.id}`}
                                    className="flex w-full items-center px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                                  >
                                    Editar
                                  </Link>
                                  <div className="border-t border-slate-100">
                                    <p className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                      Mover a
                                    </p>
                                    <div className="max-h-32 overflow-y-auto py-1">
                                      {workspaces.map((ws) => (
                                        <button
                                          key={ws.id}
                                          onClick={() =>
                                            handleMoveSurvey(survey.id as string, ws.id as string)
                                          }
                                          className="flex w-full items-center justify-between px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                                        >
                                          <span className="truncate">{ws.name || "Sin nombre"}</span>
                                          <span className="text-[10px] text-slate-400">
                                            {workspaceSurveyCounts[ws.id as string] ?? 0} f.
                                          </span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleDelete(survey.id as string)}
                                    className="flex w-full items-center px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50"
                                  >
                                    Borrar
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredSurveys.map((survey) => (
                        <div
                          key={survey.id}
                          className="relative flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
                          <div className="flex items-start gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5 text-sm font-semibold text-slate-700">
                              {survey.title?.charAt(0).toUpperCase() || "F"}
                            </span>
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <Link
                                  href={`/${locale}/surveys/${survey.id}`}
                                  className="font-medium text-slate-900 hover:underline"
                                >
                                  {survey.title || "Sin titulo"}
                                </Link>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(
                                      openMenuId === survey.id ? null : (survey.id as string)
                                    );
                                  }}
                                  className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                >
                                  ...
                                </button>
                              </div>
                              <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                                {workspaces.find((w) => w.id === survey.workspaceId)?.name ||
                                  "Sin workspace"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${
                                survey.isActive
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-50 text-slate-500"
                              }`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              {survey.isActive ? "Activo" : "Borrador"}
                            </span>
                            <span className="text-[11px]">Respuestas: -</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => handleShare(survey.id as string)}
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Compartir
                            </button>
                            <Link
                              href={`/${locale}/surveys/${survey.id}`}
                              className="text-[11px] font-medium text-slate-700 hover:underline"
                            >
                              Abrir
                            </Link>
                          </div>

                          {openMenuId === survey.id && (
                            <div
                              className="absolute right-3 top-10 z-20 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => handleShare(survey.id as string)}
                                className="flex w-full items-center px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                              >
                                Copiar link
                              </button>
                              <button
                                onClick={() => handleCopyId(survey.id as string)}
                                className="flex w-full items-center px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                              >
                                Copiar ID
                              </button>
                              <button
                                onClick={() => handleToggleActive(survey)}
                                className="flex w-full items-center px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                              >
                                {survey.isActive ? "Desactivar" : "Publicar"}
                              </button>
                              <button
                                onClick={() => handleDuplicate(survey)}
                                className="flex w-full items-center px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                              >
                                Duplicar
                              </button>
                              <Link
                                href={`/${locale}/surveys/${survey.id}`}
                                className="flex w-full items-center px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                              >
                                Editar
                              </Link>
                              <div className="border-t border-slate-100">
                                <p className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                  Mover a
                                </p>
                                <div className="max-h-32 overflow-y-auto py-1">
                                  {workspaces.map((ws) => (
                                    <button
                                      key={ws.id}
                                      onClick={() =>
                                        handleMoveSurvey(survey.id as string, ws.id as string)
                                      }
                                      className="flex w-full items-center justify-between px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                                    >
                                      <span className="truncate">{ws.name || "Sin nombre"}</span>
                                      <span className="text-[10px] text-slate-400">
                                        {workspaceSurveyCounts[ws.id as string] ?? 0} f.
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <button
                                onClick={() => handleDelete(survey.id as string)}
                                className="flex w-full items-center px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50"
                              >
                                Borrar
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { client } from "@/utils/amplify-utils";
import Modal from "@/components/ui/Modal";
import { DashboardHeader } from "./DashboardHeader";
import { WorkspaceSidebar, type WorkspaceFilter } from "./WorkspaceSidebar";
import { SurveyToolbar } from "./SurveyToolbar";
import { SurveyTableView } from "./SurveyTableView";
import { SurveyGridView } from "./SurveyGridView";
import { useWorkspaces } from "./hooks/useWorkspaces";
import { useSurveys, type SurveyListItem } from "./hooks/useSurveys";
import { useSurveyActions } from "./hooks/useSurveyActions";
import { useCreateSurvey } from "./hooks/useCreateSurvey";
import { useCreateWorkspace } from "./hooks/useCreateWorkspace";
import { useDashboardUi } from "./hooks/useDashboardUi";
import { useDashboardModals } from "./hooks/useDashboardModals";

export default function Dashboard() {
  const { search, setSearch, openMenuId, setOpenMenuId, viewMode, setViewMode, sortKey, setSortKey } =
    useDashboardUi();
  const t = useTranslations("Dashboard");
  const locale = useLocale();
  const workspaceModel = (client as any)?.models?.Workspace;
  const hasWorkspaceModel = Boolean(workspaceModel?.observeQuery);
  // Nota: la lógica de datos vive en hooks/ para que este contenedor se enfoque en la UI.
  const {
    workspaces,
    activeWorkspaceId,
    setActiveWorkspaceId,
    resolveWorkspaceId,
    activeWorkspaceName,
  } = useWorkspaces({
    workspaceModel,
    hasWorkspaceModel,
  });
  const {
    surveys,
    filteredSurveys,
    workspaceSurveyCounts,
    hasUnassigned,
    updateSurveyLocally,
  } = useSurveys({
    activeWorkspaceId,
    hasWorkspaceModel,
    search,
    sortKey,
  });
  const createSurvey = useCreateSurvey({
    hasWorkspaceModel,
    resolveWorkspaceId,
  });
  const createWorkspace = useCreateWorkspace({
    hasWorkspaceModel,
    workspaceModel,
    workspaces,
    setActiveWorkspaceId,
    setCreateWorkspaceId: createSurvey.setCreateWorkspaceId,
  });
  const modals = useDashboardModals({ createSurvey, createWorkspace });
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
  const formatUpdatedAt = useCallback(
    (value?: string | number | Date | null) => {
      if (value === null || value === undefined) return "--";
      const parsed =
        value instanceof Date ? value : new Date(typeof value === "number" ? value : value);
      if (Number.isNaN(parsed.getTime())) return "--";
      return dateFormatter.format(parsed);
    },
    [dateFormatter]
  );
  const getUpdatedValue = useCallback(
    (survey: SurveyListItem) =>
      survey.updatedAt ?? (survey as any)._lastChangedAt ?? survey.createdAt,
    []
  );

  useEffect(() => {
    if (!hasWorkspaceModel) return;
    const resolved = resolveWorkspaceId(null);
    createSurvey.syncWorkspaceSelection(resolved);
  }, [activeWorkspaceId, workspaces, hasWorkspaceModel, resolveWorkspaceId, createSurvey]);

  const {
    handleShare,
    handleCopyId,
    handleDelete,
    handleToggleActive,
    handleDuplicate,
    handleMoveSurvey,
  } = useSurveyActions({
    locale,
    t,
    hasWorkspaceModel,
    resolveWorkspaceId,
    activeWorkspaceId,
    setActiveWorkspaceId,
    setOpenMenuId,
    updateSurveyLocally,
  });

  useEffect(() => {
    const closeOnOutside = () => setOpenMenuId(null);
    window.addEventListener("click", closeOnOutside);
    return () => window.removeEventListener("click", closeOnOutside);
  }, []);

  return (
    <div className="w-full h-auto lg:h-full overflow-visible lg:overflow-hidden bg-slate-50">
      <div className="flex w-full h-auto lg:h-full lg:min-h-0 max-w-full flex-col px-4 py-4 sm:px-6 lg:px-8">
        <DashboardHeader
          activeWorkspaceName={activeWorkspaceName}
          onCreateSurvey={modals.openSurveyModal}
        />

        <div className="grid w-full gap-6 overflow-visible lg:flex-1 lg:min-h-0 lg:overflow-hidden lg:grid-cols-[260px,1fr]">
          <WorkspaceSidebar
            search={search}
            onSearchChange={setSearch}
            hasWorkspaceModel={hasWorkspaceModel}
            workspaces={workspaces}
            workspaceSurveyCounts={workspaceSurveyCounts}
            activeWorkspaceId={activeWorkspaceId}
            onWorkspaceChange={setActiveWorkspaceId}
            hasUnassigned={hasUnassigned}
            onCreateWorkspace={modals.openWorkspaceModal}
            filteredSurveysCount={filteredSurveys.length}
            totalSurveys={surveys.length}
          />

          <section className="flex flex-col sm:min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm">
            <SurveyToolbar
              activeWorkspaceName={activeWorkspaceName}
              filteredCount={filteredSurveys.length}
              viewMode={viewMode}
              onChangeView={setViewMode}
              sortKey={sortKey}
              onChangeSort={setSortKey}
            />

            <div className="flex min-h-0 flex-1 flex-col">
              {/* Empty state / table */}
                  {filteredSurveys.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-8 text-center">
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border border-dashed border-slate-300 text-slate-400">
                    +
                  </div>
                  <p className="text-sm font-medium text-slate-700">{t("empty.title")}</p>
                  <p className="text-xs text-slate-500">{t("empty.subtitle")}</p>
                  <button
                    onClick={modals.openSurveyModal}
                    className="mt-4 inline-flex items-center gap-1 rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
                  >
                    {t("empty.cta")}
                  </button>
                </div>
              ) : viewMode === "list" ? (
                <SurveyTableView
                  surveys={filteredSurveys}
                  workspaces={workspaces}
                  workspaceSurveyCounts={workspaceSurveyCounts}
                  locale={locale}
                  openMenuId={openMenuId}
                  setOpenMenuId={setOpenMenuId}
                  formatUpdatedAt={formatUpdatedAt}
                  getUpdatedValue={getUpdatedValue}
                  onShare={handleShare}
                  onCopyId={handleCopyId}
                  onToggleActive={handleToggleActive}
                  onDuplicate={handleDuplicate}
                  onMove={handleMoveSurvey}
                  onDelete={handleDelete}
                />
              ) : (
                <SurveyGridView
                  surveys={filteredSurveys}
                  workspaces={workspaces}
                  workspaceSurveyCounts={workspaceSurveyCounts}
                  locale={locale}
                  openMenuId={openMenuId}
                  setOpenMenuId={setOpenMenuId}
                  formatUpdatedAt={formatUpdatedAt}
                  getUpdatedValue={getUpdatedValue}
                  onShare={handleShare}
                  onCopyId={handleCopyId}
                  onToggleActive={handleToggleActive}
                  onDuplicate={handleDuplicate}
                  onMove={handleMoveSurvey}
                  onDelete={handleDelete}
                />
              )}
            </div>
          </section>
        </div>
      </div>

      <Modal
        open={createSurvey.showCreateModal}
        onClose={() => {
          modals.closeSurveyModal();
        }}
        title={t("modals.createSurvey.title")}
        description={t("modals.createSurvey.description")}
        footer={
          <>
            <button
              onClick={() => {
                modals.closeSurveyModal();
              }}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {t("modals.common.cancel")}
            </button>
            <button
              onClick={() => createSurvey.submitCreateSurvey(t)}
              disabled={createSurvey.savingSurvey}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
            >
              {createSurvey.savingSurvey
                ? t("modals.createSurvey.loading")
                : t("modals.createSurvey.submit")}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-800">
              {t("modals.createSurvey.nameLabel")}
            </label>
            <input
              type="text"
              value={createSurvey.newSurveyTitle}
              onChange={(e) => createSurvey.setNewSurveyTitle(e.target.value)}
              placeholder={t("modals.createSurvey.namePlaceholder")}
              aria-label={t("modals.createSurvey.nameLabel")}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          {hasWorkspaceModel && (
            <div>
              <label className="text-sm font-semibold text-slate-800">
                {t("modals.createSurvey.workspaceLabel")}
              </label>
              <select
                value={createSurvey.createWorkspaceId || ""}
                onChange={(e) => createSurvey.setCreateWorkspaceId(e.target.value || null)}
                aria-label={t("modals.createSurvey.workspaceLabel")}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="">{t("modals.createSurvey.workspacePlaceholder")}</option>
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id as string}>
                    {ws.name || t("untitledWorkspace")}
                  </option>
                ))}
              </select>
            </div>
          )}

          {createSurvey.createError && (
            <p className="text-xs font-medium text-red-600">{createSurvey.createError}</p>
          )}
        </div>
      </Modal>

      <Modal
        open={createWorkspace.showWorkspaceModal}
        onClose={() => {
          modals.closeWorkspaceModal();
        }}
        title={t("modals.createWorkspace.title")}
        description={t("modals.createWorkspace.description")}
        footer={
          <>
            <button
              onClick={() => {
                modals.closeWorkspaceModal();
              }}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {t("modals.common.cancel")}
            </button>
            <button
              onClick={() => createWorkspace.submitWorkspace(t)}
              disabled={createWorkspace.savingWorkspace}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
            >
              {createWorkspace.savingWorkspace
                ? t("modals.createWorkspace.loading")
                : t("modals.createWorkspace.submit")}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="text-sm font-semibold text-slate-800">
              {t("modals.createWorkspace.nameLabel")}
            </label>
            <input
              type="text"
              value={createWorkspace.workspaceName}
              onChange={(e) => createWorkspace.setWorkspaceName(e.target.value)}
              placeholder={t("modals.createWorkspace.namePlaceholder")}
              aria-label={t("modals.createWorkspace.nameLabel")}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-800">
              {t("modals.createWorkspace.descriptionLabel")}
            </label>
            <textarea
              value={createWorkspace.workspaceDesc}
              onChange={(e) => createWorkspace.setWorkspaceDesc(e.target.value)}
              rows={2}
              placeholder={t("modals.createWorkspace.descriptionPlaceholder")}
              aria-label={t("modals.createWorkspace.descriptionLabel")}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
          {createWorkspace.workspaceError && (
            <p className="text-xs font-medium text-red-600">
              {createWorkspace.workspaceError}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}

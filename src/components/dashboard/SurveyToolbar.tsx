"use client";

import { useTranslations } from "next-intl";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { 
  CheckIcon, 
  ChevronDownIcon, 
  DotsHorizontalIcon, 
  GridIcon, 
  ListBulletIcon 
} from "@radix-ui/react-icons";

// --- 1. Tipos ---
type SortKey = "updatedAt" | "createdAt" | "title";
type ViewMode = "list" | "grid";

type Props = {
  activeWorkspaceName: string;
  filteredCount: number;
  viewMode: ViewMode;
  onChangeView: (view: ViewMode) => void;
  sortKey: SortKey;
  onChangeSort: (key: SortKey) => void;
  canDeleteWorkspace: boolean;
  onDeleteWorkspace: () => Promise<void> | void;
  isDeletingWorkspace?: boolean;
};

// --- 2. Componente Principal ---
export function SurveyToolbar({
  activeWorkspaceName,
  filteredCount,
  viewMode,
  onChangeView,
  sortKey,
  onChangeSort,
  canDeleteWorkspace,
  onDeleteWorkspace,
  isDeletingWorkspace = false,
}: Props) {
  const t = useTranslations("Dashboard");

  const sortLabels: Record<SortKey, string> = {
    updatedAt: t("toolbar.sortUpdated"),
    createdAt: t("toolbar.sortCreated"),
    title: t("toolbar.sortAlpha"),
  };

  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:px-6">
      {/* Sección Info */}
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
          F
        </span>
        <div>
          <p className="text-sm font-medium text-slate-900">
            {t("toolbar.formsIn", { workspace: activeWorkspaceName })}
          </p>
          <p className="text-xs text-slate-500">
            {t("toolbar.results", { count: filteredCount })}
          </p>
        </div>
      </div>

      {/* Sección Controles */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        
        {/* 1. Menú de Ordenamiento (DropdownMenu) */}
        <SortMenu 
          currentSort={sortKey}
          onSortChange={onChangeSort}
          labels={sortLabels}
          labelPrefix={t("toolbar.sortLabel")}
        />

        {/* 2. Toggle de Vista (ToggleGroup) */}
        <ViewToggle 
          currentView={viewMode}
          onToggle={onChangeView}
          labels={{ list: t("view.list"), grid: t("view.grid") }}
        />

        {/* 3. Acciones de Workspace (DropdownMenu) */}
        <WorkspaceActions 
          canDelete={canDeleteWorkspace}
          isDeleting={isDeletingWorkspace}
          onDelete={onDeleteWorkspace}
          labels={{
            trigger: t("toolbar.workspaceActions"),
            delete: t("toolbar.deleteWorkspace"),
            deleting: t("toolbar.deletingWorkspace")
          }}
        />
      </div>
    </div>
  );
}

// --- 3. Sub-componentes con Radix UI ---

function SortMenu({
  currentSort,
  onSortChange,
  labels,
  labelPrefix,
}: {
  currentSort: SortKey;
  onSortChange: (k: SortKey) => void;
  labels: Record<SortKey, string>;
  labelPrefix: string;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 data-[state=open]:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
          aria-label={labelPrefix}
        >
          <span className="text-slate-500">{labelPrefix}:</span>
          <span className="font-semibold text-slate-800">{labels[currentSort]}</span>
          <ChevronDownIcon className="h-3 w-3 text-slate-500" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={5}
          className="z-50 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 text-slate-700 shadow-lg ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 duration-100"
        >
          <DropdownMenu.RadioGroup value={currentSort} onValueChange={(v) => onSortChange(v as SortKey)}>
            {(Object.keys(labels) as SortKey[]).map((key) => (
              <DropdownMenu.RadioItem
                key={key}
                value={key}
                className="relative flex cursor-default select-none items-center justify-between rounded-md px-2 py-1.5 text-[11px] font-medium outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:text-slate-900"
              >
                <span>{labels[key]}</span>
                <DropdownMenu.ItemIndicator>
                  <CheckIcon className="h-3.5 w-3.5" />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function ViewToggle({
  currentView,
  onToggle,
  labels,
}: {
  currentView: ViewMode;
  onToggle: (v: ViewMode) => void;
  labels: { list: string; grid: string };
}) {
  const itemClass = 
    "flex items-center justify-center rounded-full px-2 py-1 text-[11px] font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 data-[state=on]:bg-white data-[state=on]:text-slate-900 data-[state=on]:shadow-sm data-[state=off]:text-slate-500 data-[state=off]:hover:text-slate-700";

  return (
    <ToggleGroup.Root
      type="single"
      value={currentView}
      onValueChange={(value) => {
        if (value) onToggle(value as ViewMode);
      }}
      className="flex items-center rounded-full border border-slate-200 bg-slate-50 p-0.5"
      aria-label="View mode"
    >
      <ToggleGroup.Item value="list" className={itemClass} aria-label={labels.list}>
        {/* Usamos texto como pediste, pero podrías usar <ListBulletIcon/> aquí */}
        {labels.list}
      </ToggleGroup.Item>
      <ToggleGroup.Item value="grid" className={itemClass} aria-label={labels.grid}>
         {/* Usamos texto como pediste, pero podrías usar <GridIcon/> aquí */}
        {labels.grid}
      </ToggleGroup.Item>
    </ToggleGroup.Root>
  );
}

function WorkspaceActions({
  canDelete,
  isDeleting,
  onDelete,
  labels,
}: {
  canDelete: boolean;
  isDeleting: boolean;
  onDelete: () => void | Promise<void>;
  labels: { trigger: string; delete: string; deleting: string };
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          disabled={!canDelete || isDeleting}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=open]:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
          aria-label={labels.trigger}
        >
          <DotsHorizontalIcon className="h-4 w-4" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={5}
          className="z-50 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 text-slate-700 shadow-lg ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 duration-100"
        >
          <DropdownMenu.Item
            onSelect={(e) => {
              // Prevenimos el cierre automático si queremos mostrar estado de carga,
              // pero como isDeleting deshabilita el botón, está bien que se cierre o maneje async.
              // Aquí asumimos que onDelete maneja su propia lógica o UI global.
              onDelete();
            }}
            disabled={isDeleting}
            className="flex cursor-default select-none items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-red-600 outline-none data-[highlighted]:bg-red-50 disabled:opacity-50"
          >
            <span className="h-2 w-2 rounded-full bg-red-500" />
            {isDeleting ? labels.deleting : labels.delete}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
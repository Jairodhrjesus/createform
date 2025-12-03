import { useCallback, useEffect, useMemo, useState } from "react";
import type { Schema } from "@/amplify/data/resource";
import type { WorkspaceFilter } from "../WorkspaceSidebar";

type WorkspaceType = Schema["Workspace"]["type"];

type Params = {
  workspaceModel: any;
  hasWorkspaceModel: boolean;
};

// Maneja suscripción y selección de workspaces para mantener el UI más liviano.
export function useWorkspaces({ workspaceModel, hasWorkspaceModel }: Params) {
  const [workspaces, setWorkspaces] = useState<WorkspaceType[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<WorkspaceFilter>(() => {
    if (typeof window === "undefined") return "all";
    return (window.localStorage.getItem("activeWorkspaceId") as WorkspaceFilter) || "all";
  });
  const [creatingDefaultWorkspace, setCreatingDefaultWorkspace] = useState(false);

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

  const activeWorkspaceName = useMemo(() => {
    if (!hasWorkspaceModel) return "Mis formularios";
    if (activeWorkspaceId === "all") return "Todos los workspaces";
    if (activeWorkspaceId === "unassigned") return "Sin workspace";
    return workspaces.find((w) => w.id === activeWorkspaceId)?.name || "Workspace";
  }, [activeWorkspaceId, workspaces, hasWorkspaceModel]);

  return {
    workspaces,
    activeWorkspaceId,
    setActiveWorkspaceId,
    resolveWorkspaceId,
    activeWorkspaceName,
  };
}

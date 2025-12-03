import { useEffect, useState } from "react";

export function useDashboardUi() {
  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortKey, setSortKey] = useState<"updatedAt" | "createdAt" | "title">("updatedAt");

  // Cierra el menú contextual al hacer click fuera.
  useEffect(() => {
    const closeOnOutside = () => setOpenMenuId(null);
    window.addEventListener("click", closeOnOutside);
    return () => window.removeEventListener("click", closeOnOutside);
  }, []);

  return {
    search,
    setSearch,
    openMenuId,
    setOpenMenuId,
    viewMode,
    setViewMode,
    sortKey,
    setSortKey,
  };
}

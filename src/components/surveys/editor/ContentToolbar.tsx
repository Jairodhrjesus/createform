"use client";

type ToolbarTab = "design" | "share";

interface ContentToolbarProps {
  onAddQuestion: () => void;
  activeTab: ToolbarTab;
  onTabChange: (tab: ToolbarTab) => void;
}

const TABS: { key: ToolbarTab; label: string; description: string }[] = [
  { key: "design", label: "Diseño", description: "Editar preguntas y endings" },
  { key: "share", label: "Share & Preview", description: "Configurar y ver recorrido público" },
];

export function ContentToolbar({ onAddQuestion, activeTab, onTabChange }: ContentToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <button
        onClick={onAddQuestion}
        disabled={activeTab !== "design"}
        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
      >
        + Añadir bloque
      </button>
      <div className="flex items-center gap-2 text-sm text-slate-500">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={[
              "rounded-full border px-3 py-1.5 transition",
              activeTab === tab.key
                ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
            ].join(" ")}
            title={tab.description}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ContentToolbar;

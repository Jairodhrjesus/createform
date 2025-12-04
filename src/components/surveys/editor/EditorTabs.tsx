"use client";

import type { EditorTab } from "@/hooks/useEditorTabs";

interface EditorTabsProps {
  activeTab: EditorTab;
  onChange: (tab: EditorTab) => void;
}

const tabs: { id: EditorTab; label: string }[] = [{ id: "content", label: "Content" }];

export function EditorTabs({ activeTab, onChange }: EditorTabsProps) {
  return (
    <nav className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-1 py-1 shadow-sm">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={[
              "flex-1 rounded-full px-4 py-2 text-sm font-semibold transition",
              isActive
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50",
            ].join(" ")}
            type="button"
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

export default EditorTabs;

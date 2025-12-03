"use client";

import { useState } from "react";

export type EditorTab = "content" | "workflow" | "connect";

export function useEditorTabs(initial: EditorTab = "content") {
  const [activeTab, setActiveTab] = useState<EditorTab>(initial);

  return { activeTab, setActiveTab };
}

export default useEditorTabs;

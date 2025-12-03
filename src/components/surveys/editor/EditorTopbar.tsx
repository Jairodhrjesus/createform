"use client";

import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

interface EditorTopbarProps {
  breadcrumbs: { label: string; href?: string }[];
  title: string;
  surveyId?: string;
  userName?: string;
}

export function EditorTopbar({
  breadcrumbs,
  title,
  surveyId,
  userName,
}: EditorTopbarProps) {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-6">
        <div className="flex items-center gap-4">
          <Breadcrumbs items={breadcrumbs} />
          {surveyId ? (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              ID: {surveyId}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="#"
            className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            View plans
          </Link>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
            {userName ? userName.slice(0, 2).toUpperCase() : "ME"}
          </div>
        </div>
      </div>
      <div className="border-t border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 lg:px-6">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="h-8 w-8 rounded-full border border-slate-200 bg-white shadow-sm" />
            <div className="flex flex-col leading-tight">
              <span className="text-xs uppercase tracking-wide text-slate-500">
                Forms
              </span>
              <span className="text-base font-semibold text-slate-900">{title}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default EditorTopbar;

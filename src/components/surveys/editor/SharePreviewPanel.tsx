"use client";

import { useEffect, useMemo, useState } from "react";
import { Link2Icon, RocketIcon, EyeOpenIcon } from "@radix-ui/react-icons";

type Mode = "share" | "preview";

interface SharePreviewPanelProps {
  surveyId: string;
  surveyTitle: string;
  locale: string;
  isActive?: boolean;
  mode?: Mode;
  onPublish?: () => Promise<void> | void;
  onDraft?: () => Promise<void> | void;
}

const SHARE_CHANNELS = [
  { label: "Link", emoji: "🔗" },
  { label: "Email", emoji: "✉️" },
  { label: "Embed", emoji: "🧩" },
  { label: "Social", emoji: "📢" },
];

export function SharePreviewPanel({
  surveyId,
  surveyTitle,
  locale,
  isActive = false,
  mode = "share",
  onPublish,
  onDraft,
}: SharePreviewPanelProps) {
  const [baseUrl, setBaseUrl] = useState(process.env.NEXT_PUBLIC_SITE_URL || "");
  const [copied, setCopied] = useState(false);
  const showShareSidebar = true;

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const shareLink = useMemo(() => {
    const base = baseUrl?.replace(/\/$/, "") || "";
    return `${base}/${locale}/embed/${surveyId}`;
  }, [baseUrl, locale, surveyId]);

  const previewUrl = `${shareLink}?preview=1`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("No se pudo copiar el link", err);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[280px,1fr]">
      {showShareSidebar && (
        <aside className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Share</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">Comparte tu formulario</h3>
          <p className="text-sm text-slate-600">
            Copia el enlace o embédalo. El preview de la derecha es real (modo de solo vista).
          </p>

          <div className="mt-4 space-y-2">
            {SHARE_CHANNELS.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
              >
                <div className="flex items-center gap-2">
                  <span>{item.emoji}</span>
                  <span>{item.label}</span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">Listo</span>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Estado
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold ${
                  isActive
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
                {isActive ? "Publicado" : "Borrador"}
              </span>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <button
                type="button"
                onClick={() => onPublish?.()}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                <RocketIcon className="h-4 w-4" />
                Publicar
              </button>
              <button
                type="button"
                onClick={() => onDraft?.()}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                Pasar a borrador
              </button>
            </div>
          </div>
        </aside>
      )}

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Link2Icon className="h-4 w-4" />
            <span>Link público</span>
          </div>
          <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            <span className="truncate">{shareLink}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
            >
              {copied ? "Copiado" : "Copiar link"}
            </button>
            <a
              href={shareLink}
              target="_blank"
              className="rounded-full bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Abrir
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-900/90 text-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 text-sm">
            <div className="flex items-center gap-2">
              <EyeOpenIcon className="h-4 w-4" />
              <span>{mode === "share" ? "Vista Share" : "Preview"}</span>
              <span className="text-slate-400">Se muestra el embed real en modo vista</span>
            </div>
            <span className="rounded-full bg-slate-800 px-3 py-1 text-[11px] font-semibold text-slate-300">
              {surveyTitle || "Untitled"}
            </span>
          </div>
          <div className="relative h-[640px] overflow-hidden rounded-b-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <iframe
              src={previewUrl}
              title="Preview embed"
              className="h-full w-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/30" />
          </div>
        </div>
      </section>
    </div>
  );
}

export default SharePreviewPanel;

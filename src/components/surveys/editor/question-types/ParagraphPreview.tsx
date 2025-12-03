"use client";

interface ParagraphPreviewProps {
  placeholder?: string;
}

export function ParagraphPreview({
  placeholder = "Escribe tu respuesta...",
}: ParagraphPreviewProps) {
  return (
    <textarea
      rows={3}
      placeholder={placeholder}
      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
    />
  );
}

export default ParagraphPreview;

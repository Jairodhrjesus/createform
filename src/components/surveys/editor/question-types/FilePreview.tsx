"use client";

export function FilePreview() {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700">Carga de archivos</label>
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
        El usuario podrá subir un archivo aquí.
      </div>
    </div>
  );
}

export default FilePreview;

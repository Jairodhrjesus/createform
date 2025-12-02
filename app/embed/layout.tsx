import type { ReactNode } from "react";

export const metadata = {
  title: "SaaS Encuestas - Embed",
  description: "Vista pública incrustada de encuestas",
};

export default function EmbedLayout({ children }: { children: ReactNode }) {
  // Usa el layout raíz para html/body y solo envuelve el contenido de este segmento.
  return <>{children}</>;
}

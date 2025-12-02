import type { ReactNode } from "react";

export const metadata = {
  title: "SaaS Encuestas - Editor",
  description: "Crea y edita encuestas",
};

export default function SurveysLayout({ children }: { children: ReactNode }) {
  // Hereda html/body del layout raíz; solo renderiza el contenido del segmento.
  return <>{children}</>;
}

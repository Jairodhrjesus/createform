import type { ReactNode } from "react";

export const metadata = {
  title: "SaaS Encuestas - Resultados",
  description: "Dashboard de resultados y respuestas",
};

export default function SubmissionsLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Hereda html/body del layout raiz
  return <>{children}</>;
}

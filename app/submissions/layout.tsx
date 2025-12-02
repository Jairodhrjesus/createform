import type { ReactNode } from "react";

export const metadata = {
  title: "SaaS Encuestas - Submissions",
  description: "Historial de respuestas protegidas",
};

export default function SubmissionsLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Hereda html/body del layout raíz
  return <>{children}</>;
}

import type { ReactNode, Metadata } from "next";

export const metadata: Metadata = {
  title: "CreateForm App",
  description: "SaaS Encuestas Platform (Multi-idioma)",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // Layout mínimo: no renderiza html/body, deja que [locale]/layout.tsx lo haga.
  return <>{children}</>;
}

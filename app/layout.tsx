import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Importamos estilos de Amplify
import "@aws-amplify/ui-react/styles.css";
// Importamos la configuración
import ConfigureAmplifyClientSide from "@/components/ConfigureAmplify";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SaaS Encuestas",
  description: "Creado con Amplify Gen 2",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ConfigureAmplifyClientSide />
        {children}
      </body>
    </html>
  );
}

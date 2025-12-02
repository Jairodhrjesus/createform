import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import "@aws-amplify/ui-react/styles.css";
import ConfigureAmplifyClientSide from "@/components/ConfigureAmplify";
import AuthenticatorWrapper from "@/components/AuthenticatorWrapper";

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
        <AuthenticatorWrapper>{children}</AuthenticatorWrapper>
      </body>
    </html>
  );
}

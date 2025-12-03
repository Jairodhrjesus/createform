import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getMessages, setRequestLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import AmplifyAuthProvider from "@/components/AmplifyAuthProvider";
import AmplifyConfigurator from "@/components/AmplifyConfigurator";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "CreateForm",
  description: "SaaS Encuestas",
};

export function generateStaticParams() {
  return [{ locale: "es" }, { locale: "en" }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!["es", "en"].includes(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <div className={inter.className} data-locale={locale}>
      <NextIntlClientProvider messages={messages}>
        <AmplifyConfigurator />
        <AmplifyAuthProvider>{children}</AmplifyAuthProvider>
      </NextIntlClientProvider>
    </div>
  );
}

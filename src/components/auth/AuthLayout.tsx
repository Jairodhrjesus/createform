"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  const t = useTranslations("AuthLayout");
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      <div className="hidden md:flex md:w-1/2 bg-gray-50 p-12 flex-col justify-between border-r border-gray-100">
        <div>
          <div className="font-bold text-xl mb-12 text-[#6b282c]">{t("brand")}</div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight whitespace-pre-line">
            {t("heroTitle")}
          </h1>
          <p className="text-gray-600 text-lg max-w-md">
            {t("heroSubtitle")}
          </p>
        </div>
        <div className="text-sm text-gray-400">{t("copyright", { year: currentYear })}</div>
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}

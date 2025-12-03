"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

type NavbarProps = {
  userName?: string;
  onSignOut?: () => Promise<void> | void;
};

export default function Navbar({ userName, onSignOut }: NavbarProps) {
  const locale = useLocale();
  const t = useTranslations("Navbar");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(false);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  return (
    <nav className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex w-full items-center justify-between">
        <Link
          href={`/${locale}`}
          className="text-xl font-bold tracking-tight text-[#6b282c]"
        >
          {t("brand")}
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href={`/${locale}/submissions`}
            className="text-sm text-gray-600 transition hover:text-[#6b282c]"
          >
            {t("results")}
          </Link>
          <div className="relative flex items-center gap-4 border-l border-gray-200 pl-6">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen((v) => !v);
              }}
            className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:border-[#6b282c] hover:text-[#6b282c]"
          >
            <span className="text-gray-900">{userName || t("brand")}</span>
          </button>
            {open && (
              <div
                className="absolute right-0 top-full z-20 mt-2 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <Link
                  href={`/${locale}/settings`}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setOpen(false)}
                >
                  {t("settings")}
                </Link>
                {onSignOut && (
                  <button
                    onClick={() => {
                      setOpen(false);
                      onSignOut();
                    }}
                    className="flex w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    {t("logout")}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

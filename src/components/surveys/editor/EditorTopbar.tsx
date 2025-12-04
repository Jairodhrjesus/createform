"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Avatar from "@radix-ui/react-avatar";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

interface EditorTopbarProps {
  breadcrumbs: { label: string; href?: string }[];
  title: string;
  surveyId?: string;
  userName?: string;
  userAvatarUrl?: string | null;
  onSignOut?: () => Promise<void> | void;
}

export function EditorTopbar({
  breadcrumbs,
  title,
  surveyId,
  userName,
  userAvatarUrl,
  onSignOut,
}: EditorTopbarProps) {
  const locale = useLocale();
  const t = useTranslations("Navbar");
  const displayName = (() => {
    const trimmed = userName?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : t("brand");
  })();
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex items-center justify-between px-4 py-3 lg:px-6">
        <div className="flex items-center gap-4">
          {/* Brand Link */}
          <Link
            href={`/${locale}`}
            className="text-xl font-bold tracking-tight text-[#6b282c]"
          >
            {t("brand")}
          </Link>

          <Breadcrumbs items={breadcrumbs} />
          {surveyId ? (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              ID: {surveyId}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-4 border-l border-gray-200 pl-6">
          {/* User Dropdown */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:border-[#6b282c] hover:text-[#6b282c] focus:outline-none focus:ring-2 focus:ring-[#6b282c]/20 data-[state=open]:border-[#6b282c] data-[state=open]:text-[#6b282c]"
              >
                <Avatar.Root className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-slate-100">
                  {userAvatarUrl ? (
                    <Avatar.Image
                      src={userAvatarUrl}
                      alt={userName || t("brand")}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                  <Avatar.Fallback className="text-sm font-semibold text-slate-700">
                    {initial}
                  </Avatar.Fallback>
                </Avatar.Root>
                <span className="text-gray-900 truncate max-w-[120px]">{displayName}</span>
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className="z-20 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-lg ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100"
              >
                {/* Settings Link */}
                <DropdownMenu.Item asChild>
                  <Link
                    href={`/${locale}/settings`}
                    className="relative flex cursor-default select-none items-center rounded-md px-3 py-2 text-sm text-gray-700 outline-none transition-colors data-[highlighted]:bg-gray-50 data-[highlighted]:text-gray-900"
                  >
                    {t("settings")}
                  </Link>
                </DropdownMenu.Item>

                {/* Sign Out Button */}
                {onSignOut && (
                  <>
                    <DropdownMenu.Separator className="my-1 h-px bg-gray-100" />
                    <DropdownMenu.Item
                      onSelect={() => onSignOut()}
                      className="relative flex cursor-default select-none items-center rounded-md px-3 py-2 text-sm text-red-600 outline-none transition-colors data-[highlighted]:bg-red-50 data-[highlighted]:text-red-700"
                    >
                      {t("logout")}
                    </DropdownMenu.Item>
                  </>
                )}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
      <div className="border-t border-slate-100 bg-white">
        <div className="mx-auto flex items-center justify-between px-4 py-2 lg:px-6">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="h-8 w-8 rounded-full border border-slate-200 bg-white shadow-sm" />
            <div className="flex flex-col leading-tight">
              <span className="text-xs uppercase tracking-wide text-slate-500">
                Forms
              </span>
              <span className="text-base font-semibold text-slate-900">{title}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default EditorTopbar;

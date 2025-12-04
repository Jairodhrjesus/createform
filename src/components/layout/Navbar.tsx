"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Avatar from "@radix-ui/react-avatar";

type NavbarProps = {
  userName?: string;
  userAvatarUrl?: string | null;
  onSignOut?: () => Promise<void> | void;
};

export default function Navbar({ userName, userAvatarUrl, onSignOut }: NavbarProps) {
  const locale = useLocale();
  const t = useTranslations("Navbar");
  const displayName = (() => {
    const trimmed = userName?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : t("brand");
  })();
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <nav className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex w-full items-center justify-between">
        {/* Brand Link */}
        <Link
          href={`/${locale}`}
          className="text-xl font-bold tracking-tight text-[#6b282c]"
        >
          {t("brand")}
        </Link>

        <div className="flex items-center gap-6">
          {/* Results Link */}
          <Link
            href={`/${locale}/submissions`}
            className="text-sm text-gray-600 transition hover:text-[#6b282c]"
          >
            {t("results")}
          </Link>

          {/* User Dropdown */}
          <div className="flex items-center gap-4 border-l border-gray-200 pl-6">
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
      </div>
    </nav>
  );
}

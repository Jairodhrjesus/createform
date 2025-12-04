"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { CheckIcon, ChevronDownIcon } from "@radix-ui/react-icons";

type Option = {
  value: string;
  label: string;
  disabled?: boolean;
};

type Props = {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  menuWidthClass?: string;
};

export function DropdownSelect({
  value,
  options,
  onChange,
  placeholder = "Select",
  disabled = false,
  className = "",
  menuWidthClass = "w-48",
}: Props) {
  const selected = options.find((opt) => opt.value === value);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild disabled={disabled}>
        <button
          type="button"
          aria-label={placeholder}
          className={`flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
        >
          <span className={selected ? "text-slate-900" : "text-slate-500"}>
            {selected?.label || placeholder}
          </span>
          <ChevronDownIcon className="h-4 w-4 text-slate-500" aria-hidden />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={6}
          className={`z-20 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-800 shadow-lg ring-1 ring-slate-900/5 ${menuWidthClass}`}
        >
          <DropdownMenu.RadioGroup
            value={value}
            onValueChange={(next) => onChange(next)}
          >
            {options.map((opt) => (
              <DropdownMenu.RadioItem
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-sm font-medium hover:bg-slate-50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="truncate">{opt.label}</span>
                <DropdownMenu.ItemIndicator>
                  <CheckIcon className="h-4 w-4 text-slate-900" aria-hidden />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

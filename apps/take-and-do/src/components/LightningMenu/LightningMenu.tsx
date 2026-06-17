"use client";

import { useRouter } from "next/navigation";

import { Dropdown } from "@/components/Dropdown";
import { LightningIcon } from "@/components/Icons/LightningIcon";
import { Route } from "@/constants/route.constant";
import { cn } from "@/lib/styles/utils";
import { chromePrimaryButtonClassName } from "@/lib/styles/chrome-primary-button-classes";

const ACTIONS_MENU_OPTIONS = [
  { label: "Focus", value: "focus" as const },
  { label: "Workflows", value: "workflows" as const, disabled: true },
];

export function LightningMenu({ className }: LightningMenuProps) {
  const router = useRouter();

  return (
    <Dropdown
      className={className}
      menuOpensTo="left"
      menuMinWidth={160}
      options={ACTIONS_MENU_OPTIONS}
      onChange={(value) => {
        if (value === "focus") router.push(Route.FOCUS);
      }}
      trigger={
        <span
          className={cn(
            chromePrimaryButtonClassName,
            "relative inline-flex h-10 items-center justify-center gap-2 px-3",
          )}
          aria-label="Open actions menu"
        >
          <LightningIcon
            size={20}
            className="shrink-0 text-chrome-cta-primary-fg"
          />
          <span className="text-sm font-semibold leading-none text-chrome-cta-primary-fg">
            Actions
          </span>
        </span>
      }
    />
  );
}

interface LightningMenuProps {
  className?: string;
}

"use client";

import { usePathname, useRouter } from "next/navigation";

import { Dropdown } from "@/components/Dropdown";
import { LightningIcon } from "@/components/Icons/LightningIcon";
import { Route } from "@/constants/route.constant";
import { useFocusSessionContext } from "@/contexts/FocusSessionContext";
import { formatFocusCountdown } from "@/helpers/focus/focus-session.helper";
import { cn } from "@/lib/styles/utils";
import { chromePrimaryButtonClassName } from "@/lib/styles/chrome-primary-button-classes";

const LIGHTNING_MENU_OPTIONS = [{ label: "Focus", value: "focus" as const }];

export function LightningMenu({ className }: LightningMenuProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { runtime, systemState } = useFocusSessionContext();

  const isOnFocusPage = pathname.startsWith(Route.FOCUS);
  const isFocusSessionActive =
    runtime?.sessionType === "focus" &&
    (systemState === "running" ||
      systemState === "paused" ||
      systemState === "stopping");

  const showRemainingOffPage = isFocusSessionActive && !isOnFocusPage;
  const remainingLabel = showRemainingOffPage
    ? formatFocusCountdown(runtime.remainingSeconds)
    : null;

  return (
    <Dropdown
      className={className}
      menuOpensTo="left"
      menuMinWidth={160}
      options={LIGHTNING_MENU_OPTIONS}
      onChange={(value) => {
        if (value === "focus") router.push(Route.FOCUS);
      }}
      trigger={
        <span
          className={cn(
            chromePrimaryButtonClassName,
            "relative inline-flex h-10 items-center justify-center gap-2 p-0",
            showRemainingOffPage ? "min-w-[5.5rem] px-2.5" : "w-10",
          )}
          aria-label={
            showRemainingOffPage
              ? `Focus session active, ${remainingLabel} remaining`
              : "Open lightning menu"
          }
        >
          <LightningIcon
            size={20}
            className="shrink-0 text-chrome-cta-primary-fg"
          />
          {showRemainingOffPage && remainingLabel ? (
            <span className="font-mono text-sm font-semibold tabular-nums leading-none text-chrome-cta-primary-fg">
              {remainingLabel}
            </span>
          ) : null}
        </span>
      }
    />
  );
}

interface LightningMenuProps {
  className?: string;
}

"use client";

import { usePathname, useRouter } from "next/navigation";

import { TimerIcon } from "@/components/Icons/TimerIcon";
import { AppTooltip } from "@/components/Tooltip/AppTooltip";
import { Route } from "@/constants/route.constant";
import { useFocusSessionContext } from "@/contexts/FocusSessionContext";
import { formatFocusCountdown } from "@/helpers/focus/focus-session.helper";

import { NavButton } from "./Sidebar.ui";

export function FocusTimerSidebarButton() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { activeTimer, systemState } = useFocusSessionContext();

  const isOnFocusPage = pathname.startsWith(Route.FOCUS);
  const isFocusSessionActive =
    activeTimer?.sessionType === "focus" &&
    (systemState === "running" ||
      systemState === "paused" ||
      systemState === "stopping");

  if (!isFocusSessionActive || !activeTimer) return null;

  const remainingLabel = formatFocusCountdown(activeTimer.remainingSeconds);
  const tooltipContent = `Focus session active, ${remainingLabel} remaining`;

  return (
    <AppTooltip content={tooltipContent} side="right">
      <span className="inline-flex">
        <NavButton
          isActive={isOnFocusPage}
          aria-label={tooltipContent}
          onClick={() => router.push(Route.FOCUS)}
          className="h-auto min-h-10 flex-col gap-0.5 py-1"
        >
          <TimerIcon size={20} className="text-text-primary" />
          <span className="font-mono text-[10px] font-semibold tabular-nums leading-none">
            {remainingLabel}
          </span>
        </NavButton>
      </span>
    </AppTooltip>
  );
}

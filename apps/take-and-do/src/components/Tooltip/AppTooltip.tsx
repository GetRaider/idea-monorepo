"use client";

import * as Tooltip from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function AppTooltip({
  children,
  content,
  side = "top",
  align = "center",
  sideOffset = 6,
  delayDuration = 200,
  contentClassName,
}: AppTooltipProps) {
  return (
    <Tooltip.Provider delayDuration={delayDuration}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side={side}
            align={align}
            sideOffset={sideOffset}
            className={cn(
              "z-[10050] max-w-xs rounded-md border border-border-app bg-card-bg px-3 py-2 text-left text-xs leading-relaxed text-text-primary shadow-dropdown",
              contentClassName,
            )}
          >
            {content}
            <Tooltip.Arrow className="fill-card-bg" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

interface AppTooltipProps {
  children: ReactNode;
  content: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  delayDuration?: number;
  contentClassName?: string;
}

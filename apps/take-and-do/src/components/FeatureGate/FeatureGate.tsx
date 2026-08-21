"use client";

import * as Tooltip from "@radix-ui/react-tooltip";

import type { AppFeature } from "@/constants/guest-features.constant";
import { useFeatureAccess } from "@/contexts/UserContext";

export function FeatureGate({ feature, children, message }: FeatureGateProps) {
  const access = useFeatureAccess(feature);

  if (access.allowed) return <>{children}</>;

  const tooltipMessage = message ?? access.reason;

  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div
            className="inline-block cursor-not-allowed opacity-40"
            onPointerDownCapture={(event) => event.preventDefault()}
            onClickCapture={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            {children}
          </div>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="z-[10050] max-w-xs rounded-md border border-white/10 bg-gray-900 px-3 py-2 text-center text-xs text-text-primary shadow-lg"
            sideOffset={6}
          >
            {tooltipMessage}
            <Tooltip.Arrow className="fill-gray-900" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

interface FeatureGateProps {
  feature: AppFeature;
  children: React.ReactNode;
  message?: string;
}

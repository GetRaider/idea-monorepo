"use client";

import * as Tooltip from "@radix-ui/react-tooltip";

import { useIsAnonymous } from "@/hooks/use-is-anonymous";

interface AiGateProps {
  children: React.ReactNode;
  message?: string;
}

export function AiGate({
  children,
  message = "AI features are not available for guest users. Sign in to use them.",
}: AiGateProps) {
  const isAnonymous = useIsAnonymous();

  if (!isAnonymous) return <>{children}</>;

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
            className="z-[10050] max-w-xs rounded-md border border-white/10 bg-gray-900 px-3 py-2 text-center text-xs text-white shadow-lg"
            sideOffset={6}
          >
            {message}
            <Tooltip.Arrow className="fill-gray-900" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

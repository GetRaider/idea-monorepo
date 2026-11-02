"use client";

import { cn } from "@repo/ui";

import { WAITLIST_LABEL } from "@/content/home";

import { useOpenWaitlist } from "./landing-frame";

export function WaitlistButton({
  appearance = "hero",
  className,
}: {
  appearance?: "header" | "hero";
  className?: string;
}) {
  const openWaitlist = useOpenWaitlist();

  return (
    <button
      type="button"
      onClick={openWaitlist}
      className={cn(
        "primary-noise inline-flex items-center justify-center rounded-lg bg-white font-medium text-neutral-900",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
        appearance === "header"
          ? "h-9 px-4 text-sm"
          : "h-11 gap-2 px-5 text-sm shadow-[0_8px_30px_rgba(255,255,255,0.12)]",
        className,
      )}
    >
      <span className="relative inline-flex items-center gap-2">
        {WAITLIST_LABEL}
        {appearance === "hero" ? <ArrowIcon /> : null}
      </span>
    </button>
  );
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="size-3.5"
      fill="none"
    >
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

import { cn } from "@/lib/styles/utils";

/** Shared transition timing — duration comes from `theme.extend.transitionDuration.dropdown`. */
export const dropdownTransitionTimingClass = "duration-dropdown ease-out";

export const dropdownChevronClass = cn(
  "text-[10px] text-text-secondary transition-transform",
  dropdownTransitionTimingClass,
);

export const dropdownTriggerBorderTransitionClass = cn(
  "transition-[border-color]",
  dropdownTransitionTimingClass,
);

export const dropdownTriggerTransitionClass = cn(
  "transition-[border-color,background-color]",
  dropdownTransitionTimingClass,
);

export const dropdownMenuItemTransitionClass = cn(
  "transition-[background,color]",
  dropdownTransitionTimingClass,
);

export const dropdownPanelClass = "motion-safe:animate-dropdown-panel-in";

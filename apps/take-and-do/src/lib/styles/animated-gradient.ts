import { cn } from "@/lib/styles/utils";

/** Neutral grayscale motion (no purple). */
export const animatedGradientBgClass =
  "will-change-[background-position] [transform:translateZ(0)] bg-[length:200%_200%] bg-[linear-gradient(135deg,#141414_0%,#262626_22%,#3a3a3a_50%,#262626_78%,#121212_100%)] animate-gradient-shift";

export const gradientActionButtonClass = cn(
  animatedGradientBgClass,
  "motion-reduce:!animate-none motion-reduce:!bg-zinc-600",
);

export const gradientOptionSurfaceClass = cn(
  animatedGradientBgClass,
  "relative overflow-hidden hover:animate-gradient-shift-fast",
  "motion-reduce:!animate-none motion-reduce:!bg-zinc-600",
);

import { cn } from "@/lib/styles/utils";

export const animatedGradientBgClass =
  "will-change-[background-position] [transform:translateZ(0)] bg-[length:200%_200%] bg-[linear-gradient(135deg,#1a0a2e_0%,#2d1b4e_25%,#6a00ff_50%,#8b5cf6_75%,#9333ea_100%)] animate-gradient-shift";

export const gradientActionButtonClass = cn(
  animatedGradientBgClass,
  "motion-reduce:!animate-none motion-reduce:!bg-[#7255c1]",
);

export const gradientOptionSurfaceClass = cn(
  animatedGradientBgClass,
  "relative overflow-hidden hover:animate-gradient-shift-fast",
  "motion-reduce:!animate-none motion-reduce:!bg-[#7255c1]",
);

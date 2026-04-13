import type { StaticImageData } from "next/image";

import devinityMark from "@/images/devinity-logo.png";
import portfolioMark from "@/images/portfolio-logo.png";
import takeAndDoMark from "@repo/ui/assets/brands/take-and-do.svg";

const bySlug: Record<string, StaticImageData> = {
  "take-and-do": takeAndDoMark,
  devinity: devinityMark,
  portfolio: portfolioMark,
};

export function getProjectBrandImage(slug: string): StaticImageData | null {
  return bySlug[slug] ?? null;
}

export function getProjectRasterMatteClass(slug: string): string | undefined {
  if (slug === "portfolio") return "bg-black";
  if (slug === "devinity") return "bg-[#0d0d0d]";
  return undefined;
}

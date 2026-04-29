import type { StaticImageData } from "next/image";

import devinityMark from "@/images/devinity-logo.png";
import personalWebsiteMark from "@/images/personal-website-logo.png";
import snapWordsMark from "@/images/snap-words.logo.png";
import takeAndDoMark from "@repo/ui/assets/brands/take-and-do.svg";

const bySlug: Record<string, StaticImageData> = {
  "take-and-do": takeAndDoMark,
  devinity: devinityMark,
  "personal-website": personalWebsiteMark,
  "snap-words": snapWordsMark,
};

export function getProjectBrandImage(slug: string): StaticImageData | null {
  return bySlug[slug] ?? null;
}

export function getProjectRasterMatteClass(slug: string): string | undefined {
  if (slug === "personal-website") return "bg-black";
  if (slug === "devinity") return "bg-[#0d0d0d]";
  if (slug === "snap-words") return "bg-[#0a0c14]";
  return undefined;
}

"use client";

import { APP_CHROME_SECTION_TITLE_SIZE } from "@/helpers/app-chrome-layout";
import { cn } from "@/lib/styles/utils";

export function FocusSectionHeader({
  title,
  className,
}: FocusSectionHeaderProps) {
  return (
    <div className={cn("px-5 py-4", className)}>
      <span className={cn("m-0", APP_CHROME_SECTION_TITLE_SIZE)}>{title}</span>
    </div>
  );
}

interface FocusSectionHeaderProps {
  title: string;
  className?: string;
}

import type { ReactNode } from "react";
import { cn } from "@repo/ui";

export function ModuleSurface({ children, className }: ModuleSurfaceProps) {
  return (
    <div
      className={cn(
        "module-surface mb-2 mr-2 flex min-h-0 w-full min-w-0 overflow-hidden rounded-xl border border-white/[0.06] bg-[#131313]",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface ModuleSurfaceProps {
  children: ReactNode;
  className?: string;
}

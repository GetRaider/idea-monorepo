import type { ReactNode } from "react";

import { cn } from "../../lib/cn";

export function AuthBrandedPageShell({
  backgroundClassName,
  topLeft,
  children,
}: {
  backgroundClassName?: string;
  topLeft: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative flex min-h-screen flex-col items-center justify-center p-4",
        backgroundClassName,
      )}
    >
      <div className="absolute left-6 top-6 flex items-center gap-3">
        {topLeft}
      </div>
      {children}
    </div>
  );
}

export function AuthFormCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "w-full max-w-[440px] rounded-2xl border px-8 py-11 shadow-2xl backdrop-blur-md",
        className,
      )}
    >
      {children}
    </div>
  );
}

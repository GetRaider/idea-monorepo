import type { ReactNode } from "react";

export function SidebarTreeIconSlot({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden text-current [&_img]:h-5 [&_img]:w-5 [&_img]:max-h-none [&_img]:max-w-none [&_img]:object-contain [&_svg]:block [&_svg]:h-5 [&_svg]:w-5 [&_svg]:max-h-full [&_svg]:max-w-full [&_svg]:shrink-0">
      {children}
    </span>
  );
}

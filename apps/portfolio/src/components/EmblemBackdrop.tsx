import type { ReactNode } from "react";

export function EmblemBackdrop({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.22),transparent_55%),radial-gradient(ellipse_60%_40%_at_100%_0%,rgba(213,63,140,0.12),transparent_50%),radial-gradient(ellipse_50%_35%_at_0%_100%,rgba(79,209,197,0.12),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-teal-500/15 blur-[120px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-32 bottom-0 h-[28rem] w-[28rem] rounded-full bg-violet-600/20 blur-[140px]"
        aria-hidden
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

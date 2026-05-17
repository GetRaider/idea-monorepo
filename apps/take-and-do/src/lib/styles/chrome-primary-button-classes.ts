import { cn } from "@/lib/styles/utils";

/** Background + label + border (matches `PrimaryButton` `brand`). */
export const chromePrimaryButtonBase =
  "rounded-xl border border-black/[0.12] bg-gradient-to-b from-chrome-cta-primary-from to-chrome-cta-primary-to text-chrome-cta-primary-fg shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]";

export const chromePrimaryButtonInteractive =
  "transition-all duration-200 hover:-translate-y-0.5 hover:brightness-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500/45 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0";

/** Default interactive primary `<button>` / `<a>` surface. */
export const chromePrimaryButtonClassName = cn(
  chromePrimaryButtonBase,
  chromePrimaryButtonInteractive,
);

/** Save / submit when the action is unavailable (keeps light palette). */
export const chromePrimaryButtonDisabledClassName = cn(
  "rounded-xl border border-black/[0.08] bg-gradient-to-b from-chrome-cta-primary-from/30 to-chrome-cta-primary-to/30 text-chrome-cta-primary-fg/45 shadow-none",
  "cursor-not-allowed opacity-95",
);

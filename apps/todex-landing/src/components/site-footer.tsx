import { WaitlistButton } from "./waitlist-button";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex w-full max-w-page flex-col items-start gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-400">
          Todex — Your work, actually done.
        </p>
        <WaitlistButton />
      </div>
    </footer>
  );
}

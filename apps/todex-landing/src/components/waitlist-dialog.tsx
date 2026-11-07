"use client";

import type { FormEvent } from "react";
import { Dialog } from "@repo/ui";

import { WAITLIST_LABEL } from "@/content/home";

export function WaitlistDialog({ onClose }: { onClose: () => void }) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onClose();
  }

  return (
    <Dialog title={WAITLIST_LABEL} onClose={onClose} maxWidth={440}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1.5 text-sm text-zinc-300" htmlFor="waitlist-email">
          Email
          <input
            id="waitlist-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="h-10 rounded-lg border border-zinc-600 bg-zinc-950 px-3 text-white outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          />
        </label>
        <button
          type="submit"
          className="primary-noise inline-flex h-10 items-center justify-center rounded-lg bg-white px-4 text-sm font-medium text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <span className="relative">{WAITLIST_LABEL}</span>
        </button>
      </form>
    </Dialog>
  );
}

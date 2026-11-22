"use client";

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { Dialog } from "@repo/ui/components/Dialog";

import { getWaitlistRecipientEmail, isValidEmail, sendWaitlistRequest } from "@/lib/waitlist";

export const WAITLIST_LABEL = "Join the Waitlist";

const WaitlistContext = createContext<{ open: () => void } | null>(null);

/** One owner for the dialog, so every Join the Waitlist button opens the same one. */
export function WaitlistProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const value = useMemo(() => ({ open }), [open]);

  return (
    <WaitlistContext.Provider value={value}>
      {children}
      {isOpen ? <WaitlistDialog onClose={() => setIsOpen(false)} /> : null}
    </WaitlistContext.Provider>
  );
}

const primaryButton =
  "primary-noise inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-[10px] bg-[#f2f2f0] px-4 py-2 text-center text-sm font-medium text-[#0b0b0b] transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60";

export function JoinWaitlistButton({ className = "" }: { className?: string }) {
  const context = useContext(WaitlistContext);
  if (!context) throw new Error("JoinWaitlistButton must be inside WaitlistProvider.");

  return (
    <button type="button" onClick={context.open} className={`${primaryButton} ${className}`}>
      <span className="relative">{WAITLIST_LABEL}</span>
    </button>
  );
}

type Phase = "form" | "success";

function WaitlistDialog({ onClose }: { onClose: () => void }) {
  const recipient = getWaitlistRecipientEmail();
  const emailId = useId();
  const errorId = useId();
  const [phase, setPhase] = useState<Phase>("form");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  // The shared Dialog focuses its first control (the close button) after mount; move focus to the field.
  useEffect(() => {
    const frame = requestAnimationFrame(() => emailRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValidEmail(email)) {
      setFormError("Enter a valid email address.");
      return;
    }
    if (!recipient) {
      setFormError("Waitlist email is not configured.");
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      const response = await sendWaitlistRequest(email, recipient);
      if (response.status !== 200) {
        setFormError("Could not join the waitlist. Try again later.");
        return;
      }
      setPhase("success");
    } catch {
      setFormError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog title={WAITLIST_LABEL} onClose={onClose} maxWidth={440} showCloseButton>
      {phase === "success" ? (
        <div className="space-y-5">
          <p className="text-sm leading-relaxed text-zinc-300" role="status">
            You&apos;re on the list. We&apos;ll email you when Todex opens.
          </p>
          <button type="button" onClick={onClose} className={`${primaryButton} w-full`}>
            <span className="relative">Close</span>
          </button>
        </div>
      ) : (
        <>
          <p className="-mt-3 text-sm leading-relaxed text-zinc-400">
            Join the waitlist to hear when Todex opens.
          </p>
          <form className="mt-5 space-y-4" noValidate onSubmit={(event) => void handleSubmit(event)}>
            <div>
              <label htmlFor={emailId} className="mb-1.5 block text-sm text-zinc-300">
                Email
              </label>
              <input
                ref={emailRef}
                id={emailId}
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={submitting}
                aria-invalid={formError ? true : undefined}
                aria-describedby={formError ? errorId : undefined}
                className="w-full rounded-lg border border-white/15 bg-black px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus-visible:border-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50"
              />
            </div>
            {formError ? (
              <p id={errorId} className="text-sm text-red-400" role="alert">
                {formError}
              </p>
            ) : null}
            <button type="submit" disabled={submitting} aria-busy={submitting} className={`${primaryButton} w-full`}>
              <span className="relative">{submitting ? "Joining…" : WAITLIST_LABEL}</span>
            </button>
          </form>
        </>
      )}
    </Dialog>
  );
}

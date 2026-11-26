"use client";

import { useEffect, useState } from "react";

import { profile } from "@/data/profile";

import { CheckIcon, CopyIcon } from "./ui";

/**
 * Direct contacts, no extra click, email last: LinkedIn / GitHub open in a new tab, the email opens the mail client (mailto:), a copy button
 * sits next to it.
 * - `icons`: compact icon buttons for the header.
 * - `full`: labelled pills for the hero and footer.
 */
export function ContactLinks({ variant = "full", className = "" }: { variant?: "icons" | "full"; className?: string }) {
  const { email, linkedin, github } = profile.contact;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  };

  const icons = variant === "icons";
  const pill = icons
    ? "inline-flex size-9 items-center justify-center rounded-full border border-white/12 text-cream/85 transition-colors hover:border-ember/60 hover:text-ember"
    : "inline-flex h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-sm text-cream transition-colors hover:border-ember/60 hover:text-ember";

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <a
        href={linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className={pill}
        aria-label={icons ? "LinkedIn (opens in a new tab)" : undefined}
      >
        <LinkedInIcon />
        {icons ? null : (
          <span>
            LinkedIn<span className="sr-only"> (opens in a new tab)</span>
          </span>
        )}
      </a>
      <a
        href={github}
        target="_blank"
        rel="noopener noreferrer"
        className={pill}
        aria-label={icons ? "GitHub (opens in a new tab)" : undefined}
      >
        <GitHubIcon />
        {icons ? null : (
          <span>
            GitHub<span className="sr-only"> (opens in a new tab)</span>
          </span>
        )}
      </a>
      {email ? (
        <span className="inline-flex items-center gap-1">
          <a href={`mailto:${email}`} className={pill} aria-label={icons ? `Email ${email}` : undefined}>
            <MailIcon />
            {icons ? null : <span>{email}</span>}
          </a>
          <button
            type="button"
            onClick={copyEmail}
            className={`${icons ? "size-9" : "size-10"} inline-flex items-center justify-center rounded-full text-mist transition-colors hover:bg-white/[0.06] hover:text-ember`}
            aria-label={copied ? "Email copied" : "Copy email address"}
            title={copied ? "Copied" : "Copy email"}
          >
            {copied ? <CheckIcon className="size-4 text-ember" /> : <CopyIcon className="size-4" />}
          </button>
          <span aria-live="polite" className="sr-only">
            {copied ? "Email copied to clipboard" : ""}
          </span>
        </span>
      ) : null}
    </div>
  );
}

function MailIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4 7 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="size-4">
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11H3v-11Zm6.5 0h3.8v1.5h.06c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.77 2.65 4.77 6.1v5.45h-4v-4.83c0-1.15-.02-2.63-1.6-2.63-1.6 0-1.85 1.25-1.85 2.55v4.91h-4v-11Z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="size-4">
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.56 9.56 0 0 1 5 0c1.91-1.3 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  );
}

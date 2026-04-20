"use client";

import { useCallback } from "react";
import { toast } from "sonner";

import { profile } from "@/content/profile";

function ExternalIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="opacity-60"
      aria-hidden
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="opacity-60"
      aria-hidden
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

async function copyEmailToClipboard(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(profile.email);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = profile.email;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

type SocialLinksRowProps = {
  /** Tighter spacing for intro hero */
  compact?: boolean;
};

export function SocialLinksRow({ compact = false }: SocialLinksRowProps) {
  const onCopyEmail = useCallback(async () => {
    const ok = await copyEmailToClipboard();
    if (ok) {
      toast.success("Email copied to clipboard");
    } else {
      toast.error("Couldn't copy email");
    }
  }, []);

  const wrap = compact
    ? "flex flex-wrap items-center justify-center gap-2.5 lg:justify-start"
    : "flex flex-wrap items-center justify-center gap-3";

  const linkClass = compact
    ? "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold tracking-tight text-zinc-200 transition-colors hover:border-cyan-400/35 hover:text-white sm:text-sm"
    : "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold tracking-tight text-zinc-200 transition-colors hover:text-white";

  return (
    <div className={wrap}>
      <a
        href={profile.links.github}
        target="_blank"
        rel="noreferrer"
        className={`${linkClass} hover:border-violet-400/35`}
      >
        GitHub
        <ExternalIcon />
      </a>
      <a
        href={profile.links.linkedin}
        target="_blank"
        rel="noreferrer"
        className={`${linkClass} hover:border-cyan-400/35`}
      >
        LinkedIn
        <ExternalIcon />
      </a>
      <button
        type="button"
        onClick={onCopyEmail}
        className={`${linkClass} cursor-pointer hover:border-fuchsia-400/35`}
        aria-label="Copy email address"
      >
        Email
        <ClipboardIcon />
      </button>
    </div>
  );
}

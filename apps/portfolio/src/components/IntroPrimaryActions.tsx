"use client";

import Link from "next/link";
import { useState } from "react";

import { ContactCvDialog } from "@/components/ContactCvDialog";
import { SocialLinksRow } from "@/components/SocialLinksRow";

export function IntroPrimaryActions() {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <>
      <div className="mt-8">
        <p className="mb-3 text-[0.6rem] font-medium uppercase tracking-[0.28em] text-zinc-600">
          Connect
        </p>
        <SocialLinksRow compact />
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
        <Link
          href="/home"
          className="inline-flex rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-8 py-3 text-sm font-semibold text-white shadow-[0_0_40px_-8px_rgba(99,102,241,0.75)] transition-[transform,box-shadow] hover:scale-[1.02] hover:shadow-[0_0_48px_-6px_rgba(139,92,246,0.85)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300/80"
        >
          Explore
        </Link>
        <Link
          href="/projects"
          className="inline-flex rounded-full border border-white/15 bg-black/30 px-8 py-3 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:border-white/25 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300/80"
        >
          View projects
        </Link>
        <button
          type="button"
          onClick={() => setContactOpen(true)}
          className="inline-flex rounded-full border border-white/15 bg-black/35 px-8 py-3 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:border-cyan-400/35 hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300/80"
        >
          Request CV
        </button>
      </div>

      <ContactCvDialog
        open={contactOpen}
        onClose={() => setContactOpen(false)}
      />
    </>
  );
}

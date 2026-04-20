"use client";

import { useState } from "react";

import { GhostLink, OutlinedButton, PrimaryLink } from "@/components/buttons";
import { ContactCvDialog } from "@/components/ContactCvDialog";
import { SocialLinksRow } from "@/components/SocialLinksRow";
import { portfolioCta } from "@/constants/cta";

export function IntroPrimaryActions() {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <>
      <div className="mt-8">
        <p className="mb-3 text-[0.6rem] font-medium uppercase tracking-[0.28em] text-zinc-600">
          Resources
        </p>
        <SocialLinksRow compact />
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
        <PrimaryLink href="/home">{portfolioCta.explore}</PrimaryLink>
        <GhostLink href="/projects">{portfolioCta.seeProjects}</GhostLink>
        <OutlinedButton type="button" onClick={() => setContactOpen(true)}>
          {portfolioCta.requestCv}
        </OutlinedButton>
      </div>

      <ContactCvDialog
        open={contactOpen}
        onClose={() => setContactOpen(false)}
      />
    </>
  );
}

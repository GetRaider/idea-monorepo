"use client";

import { useState } from "react";

import { CompanyMarquee } from "@/components/CompanyMarquee";
import { ContactCvDialog } from "@/components/ContactCvDialog";
import { PillarIcon } from "@/components/PillarIcons";
import { GhostLink, PrimaryButton } from "@/components/buttons";
import { ResourcesSection } from "@/components/ResourcesSection";
import { portfolioCta } from "@/constants/cta";
import { profile } from "@/content/profile";

export default function HomePage() {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <>
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-5 inline-flex rounded-full border border-violet-500/30 bg-violet-950/25 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-violet-200/90">
            {profile.badgeLabel}
          </p>
          <h1 className="m-0 text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
            Building software that ships and lasts.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            {profile.summary}
          </p>
          <p className="mt-4 text-sm font-medium text-zinc-500">
            {profile.location}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <PrimaryButton onClick={() => setContactOpen(true)}>
              {portfolioCta.requestCv}
            </PrimaryButton>
            <GhostLink href="/projects">{portfolioCta.seeProjects}</GhostLink>
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {profile.pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="rounded-2xl border border-white/[0.07] bg-[var(--surface-glass)] p-6 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] backdrop-blur-md"
            >
              <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                <PillarIcon id={pillar.icon} />
              </div>
              <h2 className="m-0 text-base font-semibold text-white">
                {pillar.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                {pillar.body}
              </p>
            </div>
          ))}
        </div>

        <ResourcesSection />
      </main>

      <CompanyMarquee />

      <ContactCvDialog
        open={contactOpen}
        onClose={() => setContactOpen(false)}
      />
    </>
  );
}

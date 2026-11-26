import type { Metadata } from "next";

import { ExperienceCard } from "@/components/ExperienceCard";
import { Reveal } from "@/components/Reveal";
import { SectionHeader } from "@/components/ui";
import { experience } from "@/data/experience";
import { profile } from "@/data/profile";

export const metadata: Metadata = {
  title: "Experience",
  description: `${profile.name}: ${experience.length} roles across ${experience.map((entry) => entry.company).join(", ")}.`,
  alternates: { canonical: "/experience" },
};

export default function ExperiencePage() {
  return (
    <div className="px-5 pb-10 pt-16 sm:pt-24">
      <div className="mx-auto max-w-4xl">
        <SectionHeader
          as="h1"
          id="experience-title"
          eyebrow="Experience"
          title="Where I've shipped."
          lead={`${profile.title}. Roles in reverse chronological order; open one for highlights and stack.`}
          align="left"
        />
        <ol className="mt-12 space-y-6">
          {experience.map((entry) => (
            <Reveal as="li" key={entry.id}>
              <ExperienceCard entry={entry} />
            </Reveal>
          ))}
        </ol>
      </div>
    </div>
  );
}

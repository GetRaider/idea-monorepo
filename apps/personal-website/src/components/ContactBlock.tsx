import { profile } from "@/data/profile";

import { ContactLinks } from "./ContactLinks";
import { card, monoLabel } from "./ui";

/** "Looking for" + direct contacts. Closes every page via the footer. */
export function ContactBlock({ headingId }: { headingId: string }) {
  return (
    <div className={`${card} p-6 sm:p-8`}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className={monoLabel}>Looking for</p>
          <h2 id={headingId} className="mt-3 text-2xl font-medium tracking-tight text-cream sm:text-3xl">
            {profile.lookingFor}
          </h2>
          <p className="mt-2 text-sm text-mist">{profile.location}</p>
        </div>
        <ContactLinks />
      </div>
    </div>
  );
}

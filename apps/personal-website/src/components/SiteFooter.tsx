import { profile } from "@/data/profile";

import { ContactBlock } from "./ContactBlock";
import { monoLabel } from "./ui";

export function SiteFooter() {
  return (
    <footer id="contact" className="scroll-mt-24 px-5 pb-10 pt-16">
      <div className="mx-auto max-w-page">
        <ContactBlock headingId="footer-contact" />
        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className={monoLabel}>
            © {new Date().getFullYear()} {profile.name}
          </p>
          <p className={monoLabel}>{profile.title}</p>
        </div>
      </div>
    </footer>
  );
}

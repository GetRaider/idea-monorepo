import Link from "next/link";

import { AUDIENCES, HOME_COPY } from "@/content/home";

import { JoinWaitlistButton } from "./waitlist";

const label = "font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500";
const link =
  "rounded text-sm text-zinc-200 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

const PRODUCT_LINKS = [
  { href: "/#why-todex", label: "Why Todex" },
  { href: "/#workflow", label: "How it works" },
  { href: "/#faq", label: "FAQ" },
] as const;

export function SiteFooter() {
  return (
    <footer className="px-5">
      <div className="mx-auto max-w-page border-t border-white/10 pb-10 pt-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <nav aria-labelledby="footer-product">
            <h2 id="footer-product" className={label}>
              Product
            </h2>
            <ul className="mt-5 space-y-3">
              {PRODUCT_LINKS.map(({ href, label: text }) => (
                <li key={href}>
                  <Link href={href} className={link}>
                    {text}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-labelledby="footer-use-cases">
            <h2 id="footer-use-cases" className={label}>
              Use cases
            </h2>
            <ul className="mt-5 space-y-3">
              {AUDIENCES.map(({ id, audience }) => (
                <li key={id}>
                  <Link href={`/use-cases#${id}`} className={link}>
                    {audience}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <h2 className={label}>Works with</h2>
            <ul className="mt-5 space-y-3 text-sm text-zinc-400">
              {HOME_COPY.proof.tools.map((tool) => (
                <li key={tool}>{tool}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className={label}>Get started</h2>
            <p className="mt-5 max-w-[16rem] text-sm leading-relaxed text-zinc-400">Hear when Todex opens.</p>
            <JoinWaitlistButton className="mt-4" />
          </div>
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className={label}>© {new Date().getFullYear()} Todex. All rights reserved.</p>
          <p className={label}>{HOME_COPY.headlineLead}</p>
        </div>
      </div>
    </footer>
  );
}

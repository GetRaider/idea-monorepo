import Link from "next/link";
import type { ReactNode, SVGProps } from "react";

/** Glass card: faint top-lit gradient, hairline border, inner highlight. */
export const card =
  "relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.012))] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]";

export const monoLabel = "font-mono text-[11px] uppercase tracking-[0.16em] text-mist";

export const textLink =
  "rounded text-ember underline decoration-ember/40 underline-offset-4 hover:text-ember-strong hover:decoration-ember-strong";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors";

export const primaryButton = `${buttonBase} bg-ember text-ink hover:bg-ember-strong`;

export const ghostButton = `${buttonBase} border border-white/15 text-cream hover:border-white/35`;

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-mist">
      <span aria-hidden="true" className="size-1.5 rounded-full bg-ember" />
      {children}
    </p>
  );
}

export function SectionHeader({
  id,
  eyebrow,
  title,
  lead,
  align = "center",
  as: Heading = "h2",
}: {
  id: string;
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "center" | "left";
  as?: "h1" | "h2";
}) {
  const alignment = align === "center" ? "mx-auto items-center text-center" : "items-start text-left";
  return (
    <div className={`flex max-w-2xl flex-col ${alignment}`}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <Heading id={id} className="mt-5 text-3xl font-medium tracking-tight text-silver sm:text-5xl">
        {title}
      </Heading>
      {lead ? <p className="mt-4 text-sm leading-relaxed text-mist sm:text-base">{lead}</p> : null}
    </div>
  );
}

export function StatusBadge({ children, tone = "active" }: { children: ReactNode; tone?: "active" | "closed" }) {
  const colors =
    tone === "closed" ? "border-white/15 bg-white/[0.04] text-mist" : "border-ember/30 bg-ember/10 text-ember";
  const dot = tone === "closed" ? "bg-mist" : "bg-ember";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors}`}>
      <span aria-hidden="true" className={`size-1.5 rounded-full ${dot}`} />
      {children}
    </span>
  );
}

export function TagList({ items, label }: { items: readonly string[]; label: string }) {
  return (
    <ul aria-label={label} className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li key={item} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-xs text-mist">
          {item}
        </li>
      ))}
    </ul>
  );
}

export function ArrowLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={`group inline-flex items-center gap-1.5 text-sm ${textLink}`}>
      {children}
      <ArrowIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
      {...props}
    >
      {children}
    </svg>
  );
}

export function ArrowIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Icon>
  );
}

export function ExternalIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14 5h5v5M19 5l-8 8M18 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4" />
    </Icon>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon strokeWidth="1.8" {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Icon>
  );
}

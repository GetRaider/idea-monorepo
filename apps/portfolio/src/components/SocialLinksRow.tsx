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

type SocialLinksRowProps = {
  /** Tighter spacing for intro hero */
  compact?: boolean;
};

export function SocialLinksRow({ compact = false }: SocialLinksRowProps) {
  const wrap = compact
    ? "flex flex-wrap items-center justify-center gap-2.5 lg:justify-start"
    : "flex flex-wrap items-center justify-center gap-3";

  const linkClass = compact
    ? "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-zinc-200 transition-colors hover:border-cyan-400/35 hover:text-white sm:text-sm"
    : "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm text-zinc-200 transition-colors hover:text-white";

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
        href={profile.links.mail}
        className={`${linkClass} hover:border-fuchsia-400/35`}
      >
        Gmail
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
    </div>
  );
}

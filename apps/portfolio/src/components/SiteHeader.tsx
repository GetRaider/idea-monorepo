import Link from "next/link";

import portfolioLogo from "@/images/portfolio-logo.png";

const linkClass =
  "text-sm text-zinc-400 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400/80";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#050505]/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link
          href="/"
          className="flex shrink-0 items-center rounded-xl border border-white/10 bg-black p-1 shadow-[0_4px_24px_-10px_rgba(139,92,246,0.22),0_0_0_1px_rgba(255,255,255,0.06)_inset] outline-offset-4 transition-[box-shadow,transform] hover:shadow-[0_8px_28px_-10px_rgba(34,211,238,0.14)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400/70"
          aria-label="Intro"
        >
          <img
            src={portfolioLogo.src}
            width={portfolioLogo.width}
            height={portfolioLogo.height}
            alt=""
            className="h-9 w-9 rounded-[0.5rem] object-contain"
            decoding="async"
            fetchPriority="high"
          />
        </Link>
        <nav className="flex items-center gap-5 md:gap-8" aria-label="Primary">
          <Link href="/" className={linkClass}>
            Intro
          </Link>
          <Link href="/home" className={linkClass}>
            Home
          </Link>
          <Link href="/projects" className={linkClass}>
            Projects
          </Link>
        </nav>
      </div>
    </header>
  );
}

import Link from "next/link";

const links: Array<{ href: string; label: string }> = [
  { href: "/", label: "Home" },
  { href: "/vocabulary", label: "My Vocabulary" },
  { href: "/practice", label: "Practice" },
  { href: "/progress", label: "Progress" },
  { href: "/settings", label: "Settings" },
];

export function AppNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[rgba(248,246,242,0.8)] backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-sm font-semibold text-[var(--foreground)]">
          Lexly
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap rounded-full px-3 py-1 text-sm text-[var(--foreground)]/80 hover:bg-white/60 hover:text-[var(--foreground)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}


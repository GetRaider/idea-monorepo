import Image from "next/image";
import Link from "next/link";
import { FiAlertTriangle } from "react-icons/fi";

export function AuthLayout({
  title,
  children,
  subtitle = "",
  backHref,
  backLabel = "Back",
}: {
  title: string;
  children: React.ReactNode;
  subtitle?: string;
  /** When set, shows a link above the title (e.g. return to login from sign-up). */
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="app-chrome-bg flex min-h-screen flex-col items-center justify-center p-4">
      <div className="absolute left-6 top-6 flex items-center gap-3">
        <Image
          src="/logo.svg"
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 shrink-0"
          priority
        />
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">
          Take &amp; Do
        </h1>
      </div>
      <div className="relative w-full max-w-[440px] rounded-2xl border border-[#282930] bg-background-login px-8 py-11 shadow-[var(--shadow-dialog)] backdrop-blur-md">
        {backHref ? (
          <Link
            href={backHref}
            className="absolute left-8 top-8 z-10 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] no-underline transition-colors hover:text-[var(--text-primary)]"
          >
            <span aria-hidden className="text-base leading-none">
              ←
            </span>
            {backLabel}
          </Link>
        ) : null}
        <div className="text-center">
          <p className="m-0 text-2xl font-semibold text-[var(--text-primary)]">
            {title}
          </p>
          {subtitle ? (
            <p className="mx-auto mt-4 inline-flex max-w-[56ch] items-start justify-center gap-2 text-sm leading-relaxed text-[var(--text-secondary)]">
              <FiAlertTriangle className="mt-0.5 size-5 shrink-0" />
              <span>{subtitle}</span>
            </p>
          ) : null}
        </div>

        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}

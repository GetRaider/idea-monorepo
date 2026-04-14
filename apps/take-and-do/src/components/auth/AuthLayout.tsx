import Image from "next/image";
import { FiAlertTriangle } from "react-icons/fi";

import { AuthBrandedPageShell, AuthFormCard } from "@repo/ui";

export function AuthLayout({
  title,
  children,
  subtitle = "",
}: {
  title: string;
  children: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <AuthBrandedPageShell
      backgroundClassName="bg-gradient-to-br from-[#1a1a1a] to-[#3c2856]"
      topLeft={
        <>
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
        </>
      }
    >
      <AuthFormCard className="border-[#282930] bg-background-login shadow-[var(--shadow-dialog)]">
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
      </AuthFormCard>
    </AuthBrandedPageShell>
  );
}

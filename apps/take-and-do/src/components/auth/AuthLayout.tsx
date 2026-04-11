import Image from "next/image";
import { FiAlertTriangle } from "react-icons/fi";

export default function AuthLayout({
  title,
  children,
  subtitle = "",
}: {
  title: string;
  children: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#3c2856] p-4">
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
      <div className="w-full max-w-[440px] rounded-2xl border border-[#282930] bg-background-login px-8 py-11 shadow-[var(--shadow-dialog)] backdrop-blur-md">
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

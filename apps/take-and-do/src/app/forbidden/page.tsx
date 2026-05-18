import { cn } from "@/lib/styles/utils";
import { chromePrimaryButtonClassName } from "@/lib/styles/chrome-primary-button-classes";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] p-6 text-[var(--foreground)]">
      <div className="w-full max-w-md rounded-2xl border border-border-app bg-background-primary p-6 shadow-[var(--shadow-dialog)]">
        <h1 className="m-0 text-xl font-semibold">Permission denied</h1>
        <p className="mt-2 text-sm text-text-secondary">
          You don’t have permission to access that resource.
        </p>
        <p className="mt-3 text-sm text-text-secondary">
          If you think this is a mistake, try signing out and back in.
        </p>
        <a
          href="/overview"
          className={cn(
            chromePrimaryButtonClassName,
            "mt-5 inline-flex justify-center px-4 py-2 text-center text-sm font-semibold no-underline rounded-lg",
          )}
        >
          Go to overview
        </a>
      </div>
    </div>
  );
}

import { cn } from "@/lib/styles/utils";
import { SpinnerRing } from "../Spinner";

export function AuthPrimaryButton({
  onClick,
  disabled,
  loading,
  children,
}: AuthButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-[#2A2B32] bg-[#212229] px-4 py-0 text-sm font-medium text-[var(--foreground)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#25262d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
    >
      {loading ? (
        <SpinnerRing className="h-5 w-5 border-t-[var(--brand-primary)]" />
      ) : null}
      {children}
    </button>
  );
}

export function AuthSecondaryButton({
  onClick,
  disabled,
  loading,
  children,
  className,
}: AuthButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-[#1F2027] bg-[#181920] px-4 py-0 text-sm font-medium text-[var(--foreground)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1c1d24] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0",
        className,
      )}
    >
      {loading ? (
        <SpinnerRing className="h-5 w-5 border-t-[var(--brand-primary)]" />
      ) : null}
      {children}
    </button>
  );
}

type AuthButtonProps = {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
  children: React.ReactNode;
  className?: string;
};

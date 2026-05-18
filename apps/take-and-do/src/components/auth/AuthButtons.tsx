import { cn } from "@/lib/styles/utils";
import { chromePrimaryButtonClassName } from "@/lib/styles/chrome-primary-button-classes";
import { SpinnerRing } from "../Spinner";

export function AuthPrimaryButton({
  nativeType = "button",
  onClick,
  disabled,
  loading,
  children,
  className,
}: AuthPrimaryButtonProps) {
  return (
    <button
      type={nativeType}
      onClick={nativeType === "submit" ? undefined : onClick}
      disabled={disabled}
      className={cn(
        chromePrimaryButtonClassName,
        "flex h-12 w-full items-center justify-center gap-2 px-4 py-0 text-sm font-semibold",
        className,
      )}
    >
      {loading ? (
        <SpinnerRing className="h-5 w-5 border-t-chrome-cta-primary-fg" />
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
        "flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-input-login-border bg-background-primary px-4 py-0 text-sm font-medium text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-input-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0",
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

type AuthPrimaryButtonProps = {
  nativeType?: "button" | "submit";
  onClick?: () => void;
  disabled: boolean;
  loading: boolean;
  children: React.ReactNode;
  className?: string;
};

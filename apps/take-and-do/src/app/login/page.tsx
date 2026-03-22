"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { SpinnerRing } from "@/components/Spinner/Spinner";
import { trackEvent } from "@/lib/analytics";
import { authClient } from "@/lib/auth-client";

type LoadingKey = "google" | "email" | "anonymous" | null;
type GuestIntent = "exploring" | "portfolio" | "other" | null;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<LoadingKey>(null);
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [guestIntent, setGuestIntent] = useState<GuestIntent>(null);
  const [guestOtherText, setGuestOtherText] = useState("");

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const isBusy = loading !== null;

  async function handleGoogle() {
    setError(null);
    setLoading("google");
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/home",
      });
    } catch (cause) {
      setError(getErrorMessage(cause));
      setLoading(null);
    }
  }

  async function handleEmailSignIn(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading("email");
    try {
      await authClient.signIn.email({
        email,
        password,
        callbackURL: "/home",
      });
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setLoading(null);
    }
  }

  function openGuestModal() {
    setError(null);
    setGuestIntent(null);
    setGuestOtherText("");
    setGuestModalOpen(true);
  }

  async function confirmAnonymous() {
    if (!guestIntent) return;
    setLoading("anonymous");
    setError(null);
    try {
      trackEvent("Guest Visit Intent", {
        intent: guestIntent,
        intent_other_text:
          guestIntent === "other" ? guestOtherText.trim() || null : null,
        timestamp: new Date().toISOString(),
      });
      await authClient.signIn.anonymous();
      setGuestModalOpen(false);
      router.push("/home");
      router.refresh();
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)] p-4"
      style={{ color: "var(--brand-text-on-gradient)" }}
    >
      <div className="w-full max-w-[420px] rounded-2xl border border-white/20 bg-white/90 p-8 shadow-[var(--shadow-dialog)] backdrop-blur-md dark:bg-[#1a1a1a]/90">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3">
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
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Sign in</p>
        </div>

        {googleClientId ? (
          <>
            <button
              type="button"
              onClick={() => void handleGoogle()}
              disabled={isBusy}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border-color)] bg-white px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--input-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)] disabled:opacity-50 dark:bg-[#2a2a2a]"
            >
              {loading === "google" ? (
                <SpinnerRing className="h-5 w-5 border-t-[var(--brand-primary)]" />
              ) : null}
              Continue with Google
            </button>
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border-color)]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
                <span className="bg-white px-2 dark:bg-[#1a1a1a]">or</span>
              </div>
            </div>
          </>
        ) : null}

        <form className="space-y-4" onSubmit={handleEmailSignIn}>
          <div>
            <label
              htmlFor="login-email"
              className="mb-1 block text-left text-sm text-[var(--text-secondary)]"
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={isBusy}
              className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)] disabled:opacity-50"
            />
          </div>
          <div>
            <label
              htmlFor="login-password"
              className="mb-1 block text-left text-sm text-[var(--text-secondary)]"
            >
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={isBusy}
              className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)] disabled:opacity-50"
            />
          </div>
          {error ? (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={isBusy}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)] disabled:opacity-50"
            style={{ backgroundColor: "var(--brand-primary)" }}
          >
            {loading === "email" ? (
              <SpinnerRing className="h-5 w-5 border-t-white" />
            ) : null}
            Sign In
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-[var(--text-secondary)]">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium underline decoration-[var(--brand-primary)] underline-offset-2 hover:text-[var(--brand-primary)]"
          >
            Sign up
          </Link>{" "}
          {/* TODO: full sign-up flow */}
        </p>

        <div className="mt-8 rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--card-bg)]/50 p-4">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            Just exploring?
          </h2>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            Browse without an account. You get a temporary session; data stays
            with this browser until you sign out or it expires.
          </p>
          <button
            type="button"
            onClick={openGuestModal}
            disabled={isBusy}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)] disabled:opacity-50"
            style={{
              borderColor: "var(--brand-secondary)",
              color: "var(--brand-secondary)",
            }}
          >
            {loading === "anonymous" ? (
              <SpinnerRing className="h-5 w-5 border-t-[var(--brand-secondary)]" />
            ) : null}
            Continue without account
          </button>
        </div>
      </div>

      {guestModalOpen ? (
        <GuestIntentModal
          guestIntent={guestIntent}
          guestOtherText={guestOtherText}
          isBusy={isBusy}
          onCancel={() => setGuestModalOpen(false)}
          onConfirm={() => void confirmAnonymous()}
          onIntentChange={setGuestIntent}
          onOtherTextChange={setGuestOtherText}
        />
      ) : null}
    </div>
  );
}

function GuestIntentModal({
  guestIntent,
  guestOtherText,
  isBusy,
  onCancel,
  onConfirm,
  onIntentChange,
  onOtherTextChange,
}: GuestIntentModalProps) {
  const canConfirm = guestIntent !== null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-intent-title"
        className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 text-[var(--foreground)] shadow-[var(--shadow-dialog)]"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="guest-intent-title" className="text-lg font-semibold">
          Before you explore…
        </h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          What brings you here today?
        </p>

        <div className="mt-4 space-y-2">
          <IntentOption
            label="Exploring for potential use"
            description="Considering using the platform for my own needs"
            selected={guestIntent === "exploring"}
            onSelect={() => onIntentChange("exploring")}
            disabled={isBusy}
          />
          <IntentOption
            label="Reviewing a portfolio"
            description={"Checking this out as part of someone's work"}
            selected={guestIntent === "portfolio"}
            onSelect={() => onIntentChange("portfolio")}
            disabled={isBusy}
          />
          <IntentOption
            label="Other"
            description="Something else"
            selected={guestIntent === "other"}
            onSelect={() => onIntentChange("other")}
            disabled={isBusy}
          />
        </div>

        {guestIntent === "other" ? (
          <div className="mt-3">
            <label
              htmlFor="guest-intent-other"
              className="mb-1 block text-xs text-[var(--text-secondary)]"
            >
              Tell us a bit more (optional)
            </label>
            <input
              id="guest-intent-other"
              type="text"
              value={guestOtherText}
              onChange={(event) => onOtherTextChange(event.target.value)}
              disabled={isBusy}
              className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]"
            />
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            className="text-sm text-[var(--text-secondary)] underline-offset-2 hover:underline"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isBusy || !canConfirm}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)] disabled:opacity-50"
            style={{ backgroundColor: "var(--brand-primary)" }}
          >
            Let&apos;s go →
          </button>
        </div>
      </div>
    </div>
  );
}

function IntentOption({
  label,
  description,
  selected,
  onSelect,
  disabled,
}: IntentOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`w-full rounded-lg border p-3 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)] disabled:opacity-50 ${
        selected
          ? "border-[var(--brand-primary)] bg-[var(--input-bg)]"
          : "border-[var(--border-color)] hover:border-[var(--input-border-hover)]"
      }`}
    >
      <span className="font-medium text-[var(--foreground)]">{label}</span>
      <span className="mt-0.5 block text-xs text-[var(--text-tertiary)]">
        {description}
      </span>
    </button>
  );
}

function getErrorMessage(cause: unknown): string {
  if (cause && typeof cause === "object" && "message" in cause) {
    const message = (cause as { message?: string }).message;
    if (typeof message === "string" && message.length > 0) return message;
  }
  if (cause instanceof Error) return cause.message;
  return "Sign in failed. Check your credentials and try again.";
}

type GuestIntentModalProps = {
  guestIntent: GuestIntent;
  guestOtherText: string;
  isBusy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onIntentChange: (value: GuestIntent) => void;
  onOtherTextChange: (value: string) => void;
};

type IntentOptionProps = {
  label: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
  disabled: boolean;
};

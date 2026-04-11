"use client";

import { useState } from "react";
import { AiOutlineMail } from "react-icons/ai";
import { FcGoogle } from "react-icons/fc";

import { GOOGLE_SIGNUP_DISABLED_MESSAGE } from "@/constants/auth-restriction.constant";
import { Route } from "@/constants/route.constant";
import { ACCESS_RESTRICTED_NO_ACCOUNT_CODE } from "@/constants/whitelist.constant";
import { authClient } from "@/auth/client";
import { SpinnerRing } from "@/components/Spinner/Spinner";
import { toast } from "sonner";

import { AuthPrimaryButton } from "@/components/Auth/AuthButtons";

type LoadingKey = "google" | "email" | null;

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<LoadingKey>(null);
  const [isEmailSignInExpanded, setIsEmailSignInExpanded] = useState(false);

  const isBusy = loading !== null;
  const canSubmitEmailPassword =
    email.trim().length > 0 && password.trim().length > 0 && !isBusy;

  async function handleGoogle() {
    setError(null);
    setLoading("google");
    toast.loading("Redirecting to Google…", { id: "auth-google" });
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/overview",
        errorCallbackURL: Route.AUTH_ERROR,
      });
    } catch (cause) {
      setError(getErrorMessage(cause));
      setLoading(null);
      toast.error(getErrorMessage(cause), { id: "auth-google" });
    }
  }

  async function handleEmailSignIn(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading("email");
    toast.loading("Signing in…", { id: "auth-email" });
    try {
      const result = await authClient.signIn.email({
        email,
        password,
        callbackURL: "/overview",
      });
      const fetchError = getBetterAuthFetchError(result);
      if (fetchError !== undefined) {
        handleEmailSignInFailure(fetchError);
        return;
      }
      toast.success("Signed in", { id: "auth-email" });
    } catch (cause: unknown) {
      handleEmailSignInFailure(cause);
    } finally {
      setLoading(null);
    }

    function handleEmailSignInFailure(cause: unknown) {
      const raw = extractAuthErrorMessage(cause);
      if (
        isInvalidEmailPasswordAttempt(cause) ||
        raw.includes(ACCESS_RESTRICTED_NO_ACCOUNT_CODE)
      ) {
        toast.error("Email or password is incorrect", { id: "auth-email" });
        return;
      }
      const message = getErrorMessage(cause);
      setError(message);
      toast.error(message, { id: "auth-email" });
    }
  }

  return (
    <div className="space-y-3">
      <AuthPrimaryButton
        onClick={() => void handleGoogle()}
        disabled={isBusy}
        loading={loading === "google"}
      >
        <FcGoogle className="size-5" /> Continue with Google
      </AuthPrimaryButton>
      {!isEmailSignInExpanded && (
        <AuthPrimaryButton
          onClick={() => setIsEmailSignInExpanded(true)}
          disabled={isBusy}
          loading={false}
        >
          <AiOutlineMail className="size-5" /> Continue with Email
        </AuthPrimaryButton>
      )}

      {isEmailSignInExpanded && (
        <form className="space-y-4" onSubmit={handleEmailSignIn}>
          <div>
            <label
              htmlFor="auth-signin-email"
              className="mb-1 block text-left text-sm text-[var(--text-secondary)]"
            >
              Email
            </label>
            <input
              id="auth-signin-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={isBusy}
              className="w-full rounded-lg border border-[var(--input-login-border)] bg-[var(--input-login-bg)] px-3 py-2 text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)] disabled:opacity-50"
            />
          </div>
          <div>
            <label
              htmlFor="auth-signin-password"
              className="mb-1 block text-left text-sm text-[var(--text-secondary)]"
            >
              Password
            </label>
            <input
              id="auth-signin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={isBusy}
              className="w-full rounded-lg border border-[var(--input-login-border)] bg-[var(--input-login-bg)] px-3 py-2 text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)] disabled:opacity-50"
            />
          </div>
          {error ? (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={!canSubmitEmailPassword}
            className="flex w-full size-11 items-center justify-center gap-2 rounded-lg border-0 bg-[#7255c1] px-7 py-3.5 text-base font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#5a42a1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading === "email" ? (
              <SpinnerRing className="h-5 w-5 border-t-white" />
            ) : null}
            Sign In
          </button>
        </form>
      )}
    </div>
  );
}

/** Better Auth client returns `{ data, error }` and often does not throw on 401. */
function getBetterAuthFetchError(result: unknown): unknown {
  if (!result || typeof result !== "object") return undefined;
  if (!("error" in result)) return undefined;
  const err = (result as { error: unknown }).error;
  if (err === null || err === undefined) return undefined;
  return err;
}

function extractAuthErrorMessage(cause: unknown): string {
  if (cause && typeof cause === "object") {
    if (
      "message" in cause &&
      typeof (cause as { message: unknown }).message === "string"
    ) {
      return (cause as { message: string }).message;
    }
    const data = (cause as { data?: { message?: unknown } }).data;
    if (data && typeof data.message === "string") return data.message;
  }
  if (cause instanceof Error) return cause.message;
  return "";
}

function getHttpStatus(cause: unknown): number | undefined {
  if (cause && typeof cause === "object" && "status" in cause) {
    const status = (cause as { status: unknown }).status;
    if (typeof status === "number") return status;
  }
  return undefined;
}

function isInvalidEmailPasswordAttempt(cause: unknown): boolean {
  const raw = extractAuthErrorMessage(cause);
  if (raw.includes(ACCESS_RESTRICTED_NO_ACCOUNT_CODE)) return false;
  if (getHttpStatus(cause) === 401) return true;
  const lower = raw.toLowerCase();
  if (lower.includes("invalid email or password")) return true;
  return false;
}

function getErrorMessage(cause: unknown): string {
  if (cause && typeof cause === "object" && "message" in cause) {
    const message = (cause as { message?: string }).message;
    if (typeof message === "string" && message.length > 0) {
      if (message === "signup disabled" || message === "signup_disabled")
        return GOOGLE_SIGNUP_DISABLED_MESSAGE;
      return message;
    }
  }
  if (cause instanceof Error) {
    if (
      cause.message === "signup disabled" ||
      cause.message === "signup_disabled"
    )
      return GOOGLE_SIGNUP_DISABLED_MESSAGE;
    return cause.message;
  }
  return "Login failed. Check your credentials and try again.";
}

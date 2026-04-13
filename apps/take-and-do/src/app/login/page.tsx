"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { Login } from "@/components/auth/Login";
import { OtherActionsPanel } from "@/components/auth/OtherActions";
import { GOOGLE_SIGNUP_DISABLED_MESSAGE } from "@/constants/auth-restriction.constant";

export default function LoginPage() {
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") !== "signup_disabled") return;
    setUrlError(GOOGLE_SIGNUP_DISABLED_MESSAGE);
    params.delete("error");
    const query = params.toString();
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}`,
    );
  }, []);

  return (
    <AuthLayout
      title="Login"
      subtitle={`Currently, only whitelisted users are allowed.`}
    >
      <div className="space-y-8">
        {urlError ? (
          <p className="text-sm text-red-400" role="alert">
            {urlError}
          </p>
        ) : null}

        <Login />
      </div>

      <OtherActionsPanel />

      <p className="mt-8 text-center text-sm text-[var(--text-secondary)]">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-semibold underline decoration-[var(--brand-primary)] underline-offset-2 hover:text-[var(--brand-primary)]"
        >
          Sign Up
        </Link>
      </p>
    </AuthLayout>
  );
}

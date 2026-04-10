"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import AuthLayout from "@/components/Auth/AuthLayout";
import { WhitelistRestrictedAuthPanel } from "@/components/Auth/WhitelistRestrictedAuthPanel";
import { Route } from "@/constants/route.constant";

export default function AuthErrorPage() {
  const [errorCode, setErrorCode] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setErrorCode(params.get("error"));
  }, []);

  const showAccessRestrictedPanel =
    errorCode === "signup_disabled" || errorCode === "access_restricted";

  return (
    <AuthLayout title={"Access Restricted"}>
      {showAccessRestrictedPanel ? (
        <WhitelistRestrictedAuthPanel isErrorPage={true} />
      ) : (
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          We couldn&apos;t complete sign-in
          {errorCode ? (
            <>
              {" "}
              <span className="text-[var(--text-tertiary)]">({errorCode})</span>
            </>
          ) : null}
          .{" "}
          <Link
            href={Route.LOGIN}
            className="text-[var(--accent-primary)] underline underline-offset-2"
          >
            Back to sign in
          </Link>
          .
        </p>
      )}
    </AuthLayout>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import {
  resetAuthRedirectHandlers,
  setAuthRedirectHandlers,
} from "./auth-redirect.registry";

export function AuthRedirectRegistrar() {
  const router = useRouter();

  useEffect(() => {
    setAuthRedirectHandlers({
      onUnauthorized: () => router.push("/login"),
      onForbidden: () => router.push("/forbidden"),
    });
    return () => resetAuthRedirectHandlers();
  }, [router]);

  return null;
}

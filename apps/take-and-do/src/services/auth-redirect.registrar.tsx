"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import {
  resetAuthRedirectHandlers,
  setAuthRedirectHandlers,
} from "./auth-redirect.registry";
import { Route } from "@/constants/route.constant";

export function AuthRedirectRegistrar() {
  const router = useRouter();

  useEffect(() => {
    setAuthRedirectHandlers({
      onUnauthorized: () => router.push(Route.LOGIN),
    });
    return () => resetAuthRedirectHandlers();
  }, [router]);

  return null;
}

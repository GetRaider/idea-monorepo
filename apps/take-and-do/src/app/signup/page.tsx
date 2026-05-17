"use client";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { WhitelistRestrictedAuthPanel } from "@/components/auth/WhitelistRestrictedAuthPanel";
import { Route } from "@/constants/route.constant";

export default function SignupPage() {
  return (
    <AuthLayout title="Sign Up" backHref={Route.LOGIN}>
      <WhitelistRestrictedAuthPanel />
    </AuthLayout>
  );
}

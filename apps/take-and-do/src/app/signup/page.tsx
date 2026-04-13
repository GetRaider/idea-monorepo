"use client";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { WhitelistRestrictedAuthPanel } from "@/components/auth/WhitelistRestrictedAuthPanel";

export default function SignupPage() {
  return (
    <AuthLayout title="Sign Up">
      <WhitelistRestrictedAuthPanel />
    </AuthLayout>
  );
}

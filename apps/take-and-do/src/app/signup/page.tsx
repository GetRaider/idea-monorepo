"use client";

import AuthLayout from "@/components/Auth/AuthLayout";
import { WhitelistRestrictedAuthPanel } from "@/components/Auth/WhitelistRestrictedAuthPanel";

export default function SignupPage() {
  return (
    <AuthLayout title="Sign Up">
      <WhitelistRestrictedAuthPanel />
    </AuthLayout>
  );
}

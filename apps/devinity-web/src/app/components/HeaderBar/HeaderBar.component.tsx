"use client";

import Header from "@repo/ui/components/Header/Header.component";
import { signOut, useSession } from "@lib/auth-client";

export default function HeaderBar({
  hideBrandText,
  rightSlot,
}: {
  hideBrandText?: boolean;
  rightSlot?: React.ReactNode;
}) {
  const { data } = useSession();
  const user = data?.user;

  return (
    <Header
      userName={user?.name}
      userEmail={user?.email}
      userImageUrl={user?.image || undefined}
      hideBrandText={hideBrandText}
      rightSlot={rightSlot}
      onProfileClick={() => {
        // For now keep it simple; could navigate to /profile when implemented
        window.location.href = "/profile";
      }}
      onSignOut={() => {
        void signOut();
      }}
    />
  );
}

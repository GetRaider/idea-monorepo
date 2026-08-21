"use client";

import { Analytics } from "@/components/Analytics";
import { GuestBanner } from "@/components/GuestBanner";
import { GuestImportOnSignIn } from "@/hooks/user/useGuestImportOnSignIn";
import { UserProvider } from "@/contexts/UserContext";
import { FocusSessionProvider } from "@/contexts/FocusSessionContext";
import {
  CalendarRepositoryProvider,
  WorkspaceRepositoryProvider,
} from "@/repositories";
import { QueryProvider } from "@/providers/query-provider";
import { AuthRedirectRegistrar } from "@/services/auth-redirect.registrar";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <UserProvider>
        <WorkspaceRepositoryProvider>
          <CalendarRepositoryProvider>
            <FocusSessionProvider>
              <Analytics />
              <AuthRedirectRegistrar />
              <GuestImportOnSignIn />
              <GuestBanner />
              <div
                className="flex min-h-0 flex-1 flex-col overflow-hidden"
                suppressHydrationWarning
              >
                {children}
              </div>
            </FocusSessionProvider>
          </CalendarRepositoryProvider>
        </WorkspaceRepositoryProvider>
      </UserProvider>
    </QueryProvider>
  );
}

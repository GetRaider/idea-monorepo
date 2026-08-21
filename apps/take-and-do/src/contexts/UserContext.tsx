"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";

import { authClient } from "@/auth/client";
import type { AppFeature } from "@/constants/guest-features.constant";
import {
  resolveFeatureAccess,
  type FeatureAccess,
} from "@/hooks/user/resolve-feature-access";
import { setGuestSessionActive } from "@/lib/guest-api-dev-guard";

export function UserProvider({ children }: { children: ReactNode }) {
  const value = useUserContextValue();
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}

export function useFeatureAccess(feature: AppFeature): FeatureAccess {
  return useUser().getAccess(feature);
}

function useUserContextValue(): UserContextValue {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user as UserWithGuestFlag | undefined;
  const isGuest = user?.isAnonymous ?? false;
  const userId = user?.id;
  const mode: UserMode = isGuest ? "guest" : "registered";

  useEffect(() => {
    setGuestSessionActive(isGuest);
    return () => setGuestSessionActive(false);
  }, [isGuest]);

  const getAccess = useCallback(
    (feature: AppFeature) => resolveFeatureAccess({ isGuest }, feature),
    [isGuest],
  );

  const canAccess = useCallback(
    (feature: AppFeature) => getAccess(feature).allowed,
    [getAccess],
  );

  return useMemo(
    () => ({
      isPending,
      isGuest,
      mode,
      userId,
      canAccess,
      getAccess,
    }),
    [isPending, isGuest, mode, userId, canAccess, getAccess],
  );
}

const UserContext = createContext<UserContextValue | null>(null);

type UserWithGuestFlag = {
  id?: string;
  isAnonymous?: boolean;
};

type UserMode = "guest" | "registered";

interface UserContextValue {
  isPending: boolean;
  isGuest: boolean;
  mode: UserMode;
  userId: string | undefined;
  canAccess: (feature: AppFeature) => boolean;
  getAccess: (feature: AppFeature) => FeatureAccess;
}

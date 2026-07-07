import {
  GUEST_FEATURES,
  guestFeatureDisabledMessage,
  type AppFeature,
} from "@/constants/guest-features.constant";

export type FeatureAccess =
  | { allowed: true }
  | { allowed: false; reason: string };

export function resolveFeatureAccess(
  user: { isGuest: boolean },
  feature: AppFeature,
): FeatureAccess {
  if (!user.isGuest) return { allowed: true };

  if (GUEST_FEATURES[feature]) return { allowed: true };

  return {
    allowed: false,
    reason: guestFeatureDisabledMessage(feature),
  };
}

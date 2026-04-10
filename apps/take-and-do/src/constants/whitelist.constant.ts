/** Must match `auth/server.ts` — client uses this to detect unknown-email sign-in. */
export const ACCESS_RESTRICTED_NO_ACCOUNT_CODE = "ACCESS_RESTRICTED_NO_ACCOUNT";

/** Default body text for the Join the Whitelist form (FormSubmit `message` field). */
export const JOIN_WHITELIST_DEFAULT_MESSAGE =
  "Hey, I'd like to be added on the whitelist to use the Take & Do application";

/**
 * FormSubmit.co delivers submissions to the inbox in the URL:
 * `https://formsubmit.co/ajax/<this-email>`
 */
export function getWhitelistFormSubmitRecipientEmail(): string | undefined {
  return process.env.NEXT_PUBLIC_WHITELIST_CONTACT_EMAIL ?? undefined;
}

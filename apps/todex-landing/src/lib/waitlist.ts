import type { IHttpResponse } from "@repo/api/helpers";
import { postFormSubmitAjax } from "@repo/api/helpers";

export const WAITLIST_DEFAULT_MESSAGE = "I'd like to join the Todex waitlist.";

/**
 * FormSubmit.co delivers submissions to the inbox in the URL:
 * `https://formsubmit.co/ajax/<this-email>`
 */
export function getWaitlistRecipientEmail(): string | undefined {
  return process.env.NEXT_PUBLIC_WAITLIST_CONTACT_EMAIL || undefined;
}

/** Trimmed, one `@`, non-empty local part, and a domain that contains a dot. */
export function isValidEmail(value: string): boolean {
  const parts = value.trim().split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts as [string, string];
  return local.length > 0 && domain.includes(".") && !domain.startsWith(".") && !domain.endsWith(".");
}

export async function sendWaitlistRequest(
  email: string,
  recipient: string | undefined = getWaitlistRecipientEmail(),
): Promise<IHttpResponse<{ message?: string }>> {
  if (!recipient) throw new Error("Recipient email is not configured.");
  const visitor = email.trim();
  return postFormSubmitAjax(recipient, {
    subject: "Todex — Waitlist request",
    replyTo: visitor,
    email: visitor,
    message: WAITLIST_DEFAULT_MESSAGE,
  });
}

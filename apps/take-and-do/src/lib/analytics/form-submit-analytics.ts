import {
  getWhitelistFormSubmitRecipientEmail,
  JOIN_WHITELIST_DEFAULT_MESSAGE,
} from "@/constants/whitelist.constant";
import { postFormSubmitAjax } from "@repo/api/form-submit";

export async function sendJoinWhitelistFormSubmit(
  email: string,
  name: string,
  message: string,
  recipient: string | undefined = getWhitelistFormSubmitRecipientEmail(),
): Promise<{ status: number; data?: { message?: string } }> {
  if (!recipient) throw new Error("Recipient email is not configured.");
  return postFormSubmitAjax(recipient, {
    _subject: "Take & Do - Whitelist request",
    _replyto: email,
    name,
    email,
    message: message.trim() || JOIN_WHITELIST_DEFAULT_MESSAGE,
  });
}

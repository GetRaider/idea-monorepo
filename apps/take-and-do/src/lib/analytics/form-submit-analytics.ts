import type { IHttpResponse } from "@repo/api/helpers";
import { postFormSubmitAjax } from "@repo/api/helpers";

import {
  getWhitelistFormSubmitRecipientEmail,
  JOIN_WHITELIST_DEFAULT_MESSAGE,
} from "@/constants/whitelist.constant";

export async function sendJoinWhitelistFormSubmit(
  email: string,
  name: string,
  message: string,
  recipient: string | undefined = getWhitelistFormSubmitRecipientEmail(),
): Promise<IHttpResponse<{ message?: string }>> {
  if (!recipient) throw new Error("Recipient email is not configured.");
  return postFormSubmitAjax(recipient, {
    subject: "Take & Do - Whitelist request",
    replyTo: email,
    name,
    email,
    message: message.trim() || JOIN_WHITELIST_DEFAULT_MESSAGE,
  });
}

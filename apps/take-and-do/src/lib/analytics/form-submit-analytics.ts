import {
  getWhitelistFormSubmitRecipientEmail,
  JOIN_WHITELIST_DEFAULT_MESSAGE,
} from "@/constants/whitelist.constant";
import {
  httpClient,
  IHttpResponse,
} from "@repo/api/helpers/http-client.helper";

export async function sendJoinWhitelistFormSubmit(
  email: string,
  name: string,
  message: string,
  recipient: string | undefined = getWhitelistFormSubmitRecipientEmail(),
): Promise<IHttpResponse<{ message?: string }>> {
  if (!recipient) throw new Error("Recipient email is not configured.");
  return await httpClient.post<{ message?: string }>({
    url: `https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: {
      _subject: "Take & Do — Whitelist request",
      _replyto: email,
      name,
      email,
      message: message.trim() || JOIN_WHITELIST_DEFAULT_MESSAGE,
    },
  });
}

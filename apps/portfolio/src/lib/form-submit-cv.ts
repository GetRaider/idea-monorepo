import type { IHttpResponse } from "@repo/api/helpers";
import { postFormSubmitAjax } from "@repo/api/helpers";

import { getPortfolioContactEmail } from "@/constants/contact.constant";

export async function sendCvRequestFormSubmit(
  email: string,
  name: string,
  reason: string,
  recipient: string | undefined = getPortfolioContactEmail(),
): Promise<IHttpResponse<{ message?: string }>> {
  if (!recipient) throw new Error("Recipient email is not configured.");
  return postFormSubmitAjax(recipient, {
    subject: "Portfolio - CV request",
    replyTo: email,
    name,
    email,
    reason,
  });
}

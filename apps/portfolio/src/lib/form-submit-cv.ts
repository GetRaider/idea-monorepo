import { postFormSubmitAjax } from "@repo/api/form-submit";

import { getPortfolioContactEmail } from "@/constants/contact.constant";

export async function sendCvRequestFormSubmit(
  email: string,
  name: string,
  reason: string,
  recipient: string | undefined = getPortfolioContactEmail(),
): Promise<{ status: number; data?: { message?: string } }> {
  if (!recipient) throw new Error("Recipient email is not configured.");
  return postFormSubmitAjax(recipient, {
    _subject: "Portfolio - CV request",
    _replyto: email,
    name,
    email,
    reason,
  });
}

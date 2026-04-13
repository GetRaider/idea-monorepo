import { getPortfolioContactEmail } from "@/constants/contact.constant";

export async function sendCvRequestFormSubmit(
  email: string,
  name: string,
  reason: string,
  recipient: string | undefined = getPortfolioContactEmail(),
): Promise<{ status: number; data?: { message?: string } }> {
  if (!recipient) throw new Error("Recipient email is not configured.");
  const response = await fetch(
    `https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        _subject: "Portfolio — CV request",
        _replyto: email,
        name,
        email,
        reason,
      }),
    },
  );

  let data: { message?: string } | undefined;
  try {
    data = (await response.json()) as { message?: string };
  } catch {
    data = undefined;
  }

  return { status: response.status, data };
}

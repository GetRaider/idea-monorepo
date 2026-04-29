/**
 * FormSubmit.co delivers submissions to: `https://formsubmit.co/ajax/<email>`
 */
export function getPortfolioContactEmail(): string {
  return process.env.NEXT_PUBLIC_PERSONAL_WEBSITE_CONTACT_EMAIL ?? "";
}

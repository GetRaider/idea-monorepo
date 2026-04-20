/**
 * FormSubmit.co delivers submissions to: `https://formsubmit.co/ajax/<email>`
 */
export function getPortfolioContactEmail(): string {
  return process.env.NEXT_PUBLIC_PORTFOLIO_CONTACT_EMAIL ?? "";
}

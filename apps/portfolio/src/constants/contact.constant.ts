/**
 * FormSubmit.co delivers submissions to: `https://formsubmit.co/ajax/<email>`
 */
export function getPortfolioContactEmail(): string | undefined {
  return process.env.NEXT_PUBLIC_PORTFOLIO_CONTACT_EMAIL ?? undefined;
}

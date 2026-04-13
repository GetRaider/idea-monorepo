"use client";

import { useState } from "react";
import { FiPlus } from "react-icons/fi";

import { Dialog } from "@/components/Dialogs";
import { SpinnerRing } from "@/components/Spinner/Spinner";
import {
  JOIN_WHITELIST_DEFAULT_MESSAGE,
  getWhitelistFormSubmitRecipientEmail,
} from "@/constants/whitelist.constant";
import { AuthSecondaryButton } from "@/components/auth/AuthButtons";
import { mixpanelAnalytics } from "@/lib/analytics/maxpanel-analytics";
import { sendJoinWhitelistFormSubmit } from "@/lib/analytics/form-submit-analytics";

export function JoinWhitelistDialog({ onClose }: JoinWhitelistDialogProps) {
  const recipient = getWhitelistFormSubmitRecipientEmail();
  const [phase, setPhase] = useState<DialogPhase>("form");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState(JOIN_WHITELIST_DEFAULT_MESSAGE);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!recipient) {
      setFormError("Whitelist email is not configured.");
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      const response = await sendJoinWhitelistFormSubmit(
        email,
        fullName,
        message,
      );
      if (response.status !== 200) {
        setFormError(
          response.data?.message ??
            "Could not send the request. Try again later.",
        );
        return;
      }
      mixpanelAnalytics.trackEvent("Whitelist Join Request Submitted", {
        source: "join_whitelist_dialog",
        has_custom_message:
          message.trim() !== JOIN_WHITELIST_DEFAULT_MESSAGE.trim(),
      });
      setPhase("success");
    } catch {
      setFormError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      title="Join the Whitelist"
      onClose={onClose}
      maxWidth={560}
      showCloseButton
    >
      {phase === "success" ? (
        <div className="space-y-4 text-center">
          <p className="m-0 text-sm leading-relaxed text-[var(--text-primary)]">
            You&apos;ve successfully applied to join the Take &amp; Do
            whitelist!
          </p>
          <p className="m-0 text-sm leading-relaxed text-[var(--text-secondary)]">
            Our team will review it and get back to you.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-2 w-full rounded-lg border-0 bg-[#7255c1] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#5a42a1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
          >
            Close
          </button>
        </div>
      ) : (
        <>
          <p className="m-0 text-sm text-[var(--text-secondary)]">
            Join the whitelist to get early access to the app.
          </p>

          <form
            className="mt-5 space-y-4"
            onSubmit={(event) => void handleSubmit(event)}
          >
            <div>
              <label
                htmlFor="join-whitelist-email"
                className="mb-1 block text-left text-sm text-[var(--text-secondary)]"
              >
                Email <span className="text-red-400">*</span>
              </label>
              <input
                id="join-whitelist-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={submitting}
                className="w-full rounded-lg border border-[var(--input-login-border)] bg-[var(--input-login-bg)] px-3 py-2 text-sm text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)] disabled:opacity-50"
              />
            </div>
            <div>
              <label
                htmlFor="join-whitelist-name"
                className="mb-1 block text-left text-sm text-[var(--text-secondary)]"
              >
                Full name <span className="text-red-400">*</span>
              </label>
              <input
                id="join-whitelist-name"
                name="name"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
                disabled={submitting}
                className="w-full rounded-lg border border-[var(--input-login-border)] bg-[var(--input-login-bg)] px-3 py-2 text-sm text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)] disabled:opacity-50"
              />
            </div>
            <div>
              <label
                htmlFor="join-whitelist-message"
                className="mb-1 block text-left text-sm text-[var(--text-secondary)]"
              >
                Message (optional)
              </label>
              <textarea
                id="join-whitelist-message"
                name="message"
                rows={4}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                disabled={submitting}
                className="w-full resize-y rounded-lg border border-[var(--input-login-border)] bg-[var(--input-login-bg)] px-3 py-2 text-sm text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)] disabled:opacity-50"
              />
            </div>

            {formError ? (
              <p className="text-sm text-red-400" role="alert">
                {formError}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="text-sm text-[var(--text-secondary)] underline-offset-2 hover:underline disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !recipient}
                className="flex min-w-[120px] items-center justify-center gap-2 rounded-lg border-0 bg-[#7255c1] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#5a42a1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {submitting ? (
                  <SpinnerRing className="h-5 w-5 border-t-white" />
                ) : null}
                Submit
              </button>
            </div>
          </form>
        </>
      )}
    </Dialog>
  );
}

export function JoinWhitelistOutlineButton({
  onClick,
  disabled = false,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <AuthSecondaryButton onClick={onClick} disabled={disabled} loading={false}>
      <FiPlus className="size-5" />
      Join the Whitelist
    </AuthSecondaryButton>
  );
}

type JoinWhitelistDialogProps = {
  onClose: () => void;
};

type DialogPhase = "form" | "success";

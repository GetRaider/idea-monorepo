"use client";

import { type FormEvent, useEffect, useState } from "react";

import {
  Dialog,
  DialogFormButton,
  DialogFormGroup,
  DialogFormLabel,
  SpinnerRing,
} from "@repo/ui";

import { getPortfolioContactEmail } from "@/constants/contact.constant";
import { sendCvRequestFormSubmit } from "@/lib/form-submit-cv";

type DialogPhase = "form" | "success";

export function ContactCvDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const recipient = getPortfolioContactEmail();
  const [phase, setPhase] = useState<DialogPhase>("form");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setPhase("form");
    setEmail("");
    setFullName("");
    setReason("");
    setFormError(null);
    setSubmitting(false);
  }, [open]);

  const resetAndClose = () => {
    onClose();
  };

  if (!open) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!recipient) {
      setFormError("Contact email is not configured.");
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      const response = await sendCvRequestFormSubmit(
        email,
        fullName,
        reason,
        recipient,
      );
      if (response.status !== 200) {
        setFormError(
          response.data?.message ??
            "Could not send the request. Try again later.",
        );
        return;
      }
      setPhase("success");
    } catch {
      setFormError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      title={phase === "form" ? "Request my CV" : "Sent"}
      subtitle={
        phase === "form"
          ? "Please, describe your interest and I'll get back to you as soon as possible."
          : "Thanks - I will get back to you shortly."
      }
      onClose={resetAndClose}
      maxWidth={480}
    >
      {phase === "success" ? (
        <DialogFormButton
          type="button"
          primary
          className="w-full sm:w-auto"
          onClick={resetAndClose}
        >
          Close
        </DialogFormButton>
      ) : (
        <>
          <form
            className="mt-5 space-y-4"
            onSubmit={(event) => void handleSubmit(event)}
          >
            <DialogFormGroup>
              <DialogFormLabel htmlFor="cv-request-name">
                Full Name <span className="text-rose-400">*</span>
              </DialogFormLabel>
              <input
                id="cv-request-name"
                name="name"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
                disabled={submitting}
                className="w-full rounded-lg border border-white/10 bg-zinc-950/80 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400/70 disabled:opacity-50"
              />
            </DialogFormGroup>
            <DialogFormGroup>
              <DialogFormLabel htmlFor="cv-request-email">
                Email <span className="text-rose-400">*</span>
              </DialogFormLabel>
              <input
                id="cv-request-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={submitting}
                className="w-full rounded-lg border border-white/10 bg-zinc-950/80 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400/70 disabled:opacity-50"
              />
            </DialogFormGroup>
            <DialogFormGroup>
              <DialogFormLabel htmlFor="cv-request-reason">
                Message <span className="text-rose-400">*</span>
              </DialogFormLabel>
              <textarea
                id="cv-request-reason"
                name="reason"
                rows={4}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                required
                disabled={submitting}
                placeholder="Please describe in a nutshell why you are reaching out."
                className="w-full resize-y rounded-lg border border-white/10 bg-zinc-950/80 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400/70 disabled:opacity-50"
              />
            </DialogFormGroup>

            {formError && (
              <p className="m-0 text-sm text-rose-400">{formError}</p>
            )}

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <DialogFormButton
                type="button"
                onClick={resetAndClose}
                disabled={submitting}
              >
                Cancel
              </DialogFormButton>
              <DialogFormButton
                type="submit"
                primary
                disabled={submitting}
                className="inline-flex min-w-[8.5rem] items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <SpinnerRing className="h-5 w-5 border-t-white" />
                    Sending
                  </>
                ) : (
                  "Send Request"
                )}
              </DialogFormButton>
            </div>
          </form>
        </>
      )}
    </Dialog>
  );
}

import type { IHttpResponse } from "./http-client.helper";
import { httpClient } from "./http-client.helper";

export async function postFormSubmitAjax<
  T extends { message?: string } = { message?: string },
>(recipientEmail: string, body: FormSubmitBody): Promise<IHttpResponse<T>> {
  return httpClient.post<T>({
    url: `$https://formsubmit.co/ajax/${encodeURIComponent(recipientEmail)}`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: toFormSubmitWire(body),
  });
}

function toFormSubmitWire(body: FormSubmitBody): Record<string, unknown> {
  const { subject, replyTo, ...rest } = body;
  const wire: Record<string, unknown> = {
    _subject: subject,
    ...rest,
  };
  if (replyTo !== undefined) {
    wire._replyto = replyTo;
  }
  return wire;
}

export type FormSubmitBody = {
  subject: string;
  replyTo?: string;
} & Record<string, string | number | boolean | null | undefined>;

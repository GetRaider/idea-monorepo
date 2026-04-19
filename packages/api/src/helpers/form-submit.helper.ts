import { httpClient } from "./http-client.helper";

const FORMSUBMIT_AJAX_BASE = "https://formsubmit.co/ajax";

export type FormSubmitAjaxBody = {
  _subject: string;
  _replyto?: string;
  [key: string]: unknown;
};

export async function postFormSubmitAjax<
  T extends { message?: string } = { message?: string },
>(
  recipientEmail: string,
  body: FormSubmitAjaxBody,
): Promise<{ status: number; data?: T }> {
  const url = `${FORMSUBMIT_AJAX_BASE}/${encodeURIComponent(recipientEmail)}`;
  const response = await httpClient.post<T>({
    url,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body,
  });

  return {
    status: response.status,
    data: response.data,
  };
}

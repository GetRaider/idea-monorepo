export type ApiOk<T> = { ok: true; data: T };

export type ApiError =
  | { ok: false; kind: "http"; status: number; body: unknown }
  | { ok: false; kind: "transport"; cause: unknown };

export type ApiResult<T> = ApiOk<T> | ApiError;

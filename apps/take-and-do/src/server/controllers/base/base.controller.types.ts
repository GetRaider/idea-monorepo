import { NextRequest } from "next/server";
import { type z } from "zod";

export type OptionalZodSchema = z.ZodType<unknown> | undefined;

export type InferredDto<Dto extends z.ZodType<unknown> | undefined> =
  Dto extends z.ZodType<unknown> ? z.output<Dto> : null;

export interface Inputs<TParams, TQuery, TBody> {
  params: TParams | null;
  query: TQuery | null;
  body: TBody | null;
}

export interface GetInputsParams<TParams, TQuery, TBody> {
  paramsDto?: z.ZodType<TParams>;
  queryDto?: z.ZodType<TQuery>;
  bodyDto?: z.ZodType<TBody>;
  context: NextAppRouteContext;
  request: NextRequest;
}

export interface ErrorResponseBody {
  error: string;
  details?: string;
}

export type NextAppRouteContext = {
  params: Promise<Record<string, string | string[]>>;
};

export type AppRouteHandler = (
  request: NextRequest,
  context: NextAppRouteContext,
) => Promise<Response>;

export interface HandlerParams<TParams = null, TQuery = null, TBody = null> {
  request: NextRequest;
  context: NextAppRouteContext;
  params: TParams;
  query: TQuery;
  body: TBody;
}

export type InitRouteParams<
  ParamsDto extends z.ZodType<unknown> | undefined,
  QueryDto extends z.ZodType<unknown> | undefined,
  BodyDto extends z.ZodType<unknown> | undefined,
  TResponse,
> = {
  paramsDto?: ParamsDto;
  queryDto?: QueryDto;
  bodyDto?: BodyDto;
  responseDto?: z.ZodType<TResponse>;
  handler: (
    params: HandlerParams<
      InferredDto<ParamsDto>,
      InferredDto<QueryDto>,
      InferredDto<BodyDto>
    >,
  ) => Promise<TResponse | Response>;
  status?: number;
};

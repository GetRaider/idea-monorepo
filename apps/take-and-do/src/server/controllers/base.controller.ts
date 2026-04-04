import { NextRequest, NextResponse } from "next/server";
import { ZodError, type z } from "zod";

import { HttpError } from "@/lib/api/errors";
import { formatZodError } from "@/lib/api/format-zod-error";

export class BaseController {
  protected initRoute<
    const PDto extends OptionalZodSchema = undefined,
    const QDto extends OptionalZodSchema = undefined,
    const BDto extends OptionalZodSchema = undefined,
    TResponse = unknown,
  >({
    paramsDto,
    queryDto,
    bodyDto,
    responseDto,
    handler,
    status = 200,
  }: InitRouteParams<PDto, QDto, BDto, TResponse>): AppRouteHandler {
    return async (request, context) => {
      try {
        const { params, query, body } = await this.getRequestInputs({
          paramsDto,
          queryDto,
          bodyDto,
          context,
          request,
        });

        const response = await handler({
          request,
          context,
          params: params as InferredDto<PDto>,
          query: query as InferredDto<QDto>,
          body: body as InferredDto<BDto>,
        });

        // Handles: No body (204 / 205), Redirects, Non-JSON body
        if (response instanceof Response) return response;

        const validatedResponse = responseDto
          ? this.validateResponseDto(responseDto, response)
          : response;

        return NextResponse.json(validatedResponse, { status });
      } catch (error) {
        return this.handleError(error);
      }
    };
  }

  private async getRequestInputs<TParams, TQuery, TBody>({
    paramsDto,
    queryDto,
    bodyDto,
    context,
    request,
  }: GetInputsParams<TParams, TQuery, TBody>): Promise<
    Inputs<TParams, TQuery, TBody>
  > {
    const params = paramsDto
      ? this.validateRequestDto(paramsDto, await context.params)
      : null;

    const query = queryDto
      ? this.validateRequestDto(
          queryDto,
          Object.fromEntries(new URL(request.url).searchParams),
        )
      : null;

    const body = bodyDto
      ? this.validateRequestDto(bodyDto, await request.json())
      : null;

    return { params, query, body };
  }

  private validateRequestDto<T>(dto: z.ZodType<T>, data: unknown): T {
    return dto.parse(data);
  }

  private validateResponseDto<T>(
    responseDto: z.ZodType<T>,
    response: unknown,
  ): T {
    const validated = responseDto.safeParse(response);
    if (!validated.success) {
      console.error("Invalid response shape", validated.error);
      throw new HttpError(500, "Unexpected response shape");
    }
    return validated.data;
  }

  private handleError(error: unknown): NextResponse {
    if (error instanceof HttpError) return this.sendHttpError(error);
    if (error instanceof ZodError) return this.sendZodError(error);
    return this.sendUnknownError(error);
  }

  private sendHttpError(error: HttpError): NextResponse {
    const responseBody: ErrorResponseBody = { error: error.message };
    if (error.details) responseBody.details = error.details;
    return NextResponse.json(responseBody, { status: error.status });
  }

  private sendZodError(error: ZodError): NextResponse {
    return NextResponse.json(
      { error: "DTO validation failed", details: formatZodError(error) },
      { status: 400 },
    );
  }

  private sendUnknownError(error: unknown): NextResponse {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

type OptionalZodSchema = z.ZodType<unknown> | undefined;

type InferredDto<Dto extends z.ZodType<unknown> | undefined> =
  Dto extends z.ZodType<unknown> ? z.output<Dto> : null;

interface Inputs<TParams, TQuery, TBody> {
  params: TParams | null;
  query: TQuery | null;
  body: TBody | null;
}

interface GetInputsParams<TParams, TQuery, TBody> {
  paramsDto?: z.ZodType<TParams>;
  queryDto?: z.ZodType<TQuery>;
  bodyDto?: z.ZodType<TBody>;
  context: NextAppRouteContext;
  request: NextRequest;
}

interface ErrorResponseBody {
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

type InitRouteParams<
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

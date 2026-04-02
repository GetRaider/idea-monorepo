import { NextRequest, NextResponse } from "next/server";
import { ZodError, type z } from "zod";

import { HttpError } from "@/lib/api/errors";
import { formatZodError } from "@/lib/api/format-zod-error";

export class BaseController {
  protected createRoute<TRequest, TResponse>({
    requestDto,
    inputType,
    handler,
    responseDto,
    status = 200,
  }: CreateRouteParams<TRequest, TResponse>): AppRouteHandler {
    return async (request, context) => {
      try {
        const inputData: TRequest =
          requestDto && inputType
            ? await this.getVerifiedInputData(
                request,
                context,
                inputType,
                requestDto,
              )
            : ({} as TRequest);

        const response = await handler({
          request,
          context,
          input: inputData,
        });

        if (response instanceof Response) return response;

        const finalResponse = responseDto
          ? this.validateResponseDto(responseDto, response)
          : response;

        return NextResponse.json(finalResponse, { status });
      } catch (error) {
        return this.handleError(error);
      }
    };
  }

  private async getVerifiedInputData<TRequest>(
    request: NextRequest,
    context: NextAppRouteContext,
    inputType: InputType,
    requestDto: z.ZodType<TRequest>,
  ): Promise<TRequest> {
    const rawInputData = await this.getRawInputData(
      request,
      context,
      inputType,
    );
    return this.validateRequestDto(requestDto, rawInputData);
  }

  private async getRawInputData(
    request: NextRequest,
    context: NextAppRouteContext,
    inputType: InputType,
  ): Promise<Record<string, unknown>> {
    switch (inputType) {
      case InputType.Body:
        return request.json();
      case InputType.Params: {
        return (await context.params) as Record<string, unknown>;
      }
      case InputType.Query:
        return Object.fromEntries(new URL(request.url).searchParams);
      default:
        throw new HttpError(400, `Invalid request source: '${inputType}'`);
    }
  }

  private validateResponseDto<TResponse>(
    responseDto: z.ZodType<TResponse>,
    response: unknown,
  ): unknown {
    const validated = responseDto.safeParse(response);
    if (!validated.success) {
      console.error("Invalid response shape", validated.error);
      throw new HttpError(500, "Unexpected response shape");
    }
    return validated.data;
  }

  private validateRequestDto<TRequest>(
    requestDto: z.ZodType<TRequest>,
    parsedInputData: Record<string, unknown>,
  ): TRequest {
    return requestDto.parse(parsedInputData);
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

export enum InputType {
  Body = "body",
  Params = "params",
  Query = "query",
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

interface HandlerParams<TRequest> {
  request: NextRequest;
  context: NextAppRouteContext;
  input: TRequest;
}

type InputValidationCondition<TRequest> =
  | { requestDto: z.ZodType<TRequest>; inputType: InputType }
  | { requestDto?: never; inputType?: never };

type CreateRouteParams<TRequest, TResponse> =
  InputValidationCondition<TRequest> & {
    handler: (params: HandlerParams<TRequest>) => Promise<TResponse | Response>;
    responseDto?: z.ZodType<unknown>;
    status?: number;
  };

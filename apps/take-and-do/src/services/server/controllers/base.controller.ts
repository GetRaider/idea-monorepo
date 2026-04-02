import { NextRequest, NextResponse } from "next/server";
import { ZodError, type z } from "zod";

import { HttpError } from "@/lib/api/errors";
import { formatZodError } from "@/lib/api/format-zod-error";

export type NextAppRouteContext = {
  params: Promise<Record<string, string | string[]>>;
};

export type AppRouteHandler = (
  request: NextRequest,
  context: NextAppRouteContext,
) => Promise<Response>;

export abstract class BaseController {
  protected createRoute<TRequest = void, TResponse = unknown>(options: {
    requestDto?: z.ZodType<TRequest>;
    responseDto?: z.ZodType<TResponse>;
    requestSource?: (
      req: NextRequest,
      ctx: NextAppRouteContext,
    ) => unknown | Promise<unknown>;
    jsonStatus?: number;
    handler: (
      req: NextRequest,
      body: [TRequest] extends [void] ? undefined : TRequest,
      ctx: NextAppRouteContext,
    ) => Promise<TResponse | Response>;
  }): AppRouteHandler {
    return async (req, ctx) => {
      try {
        let body: TRequest | undefined;

        if (options.requestDto) {
          const raw = options.requestSource
            ? await options.requestSource(req, ctx)
            : await req.json();
          body = options.requestDto.parse(raw);
        }

        const result = await options.handler(
          req,
          body as [TRequest] extends [void] ? undefined : TRequest,
          ctx,
        );

        if (result instanceof Response) {
          return result;
        }

        if (options.responseDto) {
          const validated = options.responseDto.safeParse(result);
          if (!validated.success) {
            console.error("Invalid response shape", validated.error);
            throw new HttpError(500, "Unexpected response shape");
          }
          return NextResponse.json(validated.data, {
            status: options.jsonStatus ?? 200,
          });
        }

        return NextResponse.json(result, {
          status: options.jsonStatus ?? 200,
        });
      } catch (error) {
        return this.handleError(error);
      }
    };
  }

  private handleError(error: unknown): NextResponse {
    if (error instanceof HttpError) {
      const responseBody: { error: string; details?: string } = {
        error: error.message,
      };
      if (error.details) responseBody.details = error.details;
      return NextResponse.json(responseBody, { status: error.status });
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "DTO validation failed",
          details: formatZodError(error),
        },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

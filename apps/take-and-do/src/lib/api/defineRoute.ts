import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { HttpError } from "./errors";

type NextHandler = (
  request: NextRequest,
  context?: unknown,
) => Promise<NextResponse | Response>;

export function defineRoute(handler: NextHandler): NextHandler {
  return async (request: NextRequest, context: unknown) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof HttpError) {
        const body: { error: string; details?: string } = {
          error: error.message,
        };
        if (error.details) body.details = error.details;
        return NextResponse.json(body, { status: error.status });
      }

      if (error instanceof ZodError) {
        const details = error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ");
        return NextResponse.json(
          { error: "Validation failed", details },
          { status: 400 },
        );
      }

      const message = error instanceof Error ? error.message : "Unknown error";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}

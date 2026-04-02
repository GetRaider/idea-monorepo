import { NextRequest, NextResponse } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { HttpError } from "@/lib/api/errors";

import {
  BaseController,
  InputType,
  type NextAppRouteContext,
} from "../base.controller";

const emptyCtx: NextAppRouteContext = { params: Promise.resolve({}) };

function jsonRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("BaseController", () => {
  describe("createRoute", () => {
    it("returns 200 with validated response on success", async () => {
      class TestController extends BaseController {
        run = this.createRoute({
          responseDto: z.object({ message: z.string() }),
          handler: async () => ({ message: "ok" }),
        });
      }
      const response = await new TestController().run(
        new NextRequest("http://localhost/"),
        emptyCtx,
      );
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ message: "ok" });
    });

    it("validates request body and passes typed input to handler", async () => {
      const inputSpy = vi.fn();
      const nameBodySchema = z.object({ name: z.string() });
      class TestController extends BaseController {
        run = this.createRoute({
          requestDto: nameBodySchema,
          inputType: InputType.Body,
          responseDto: z.object({ ok: z.literal(true) }),
          handler: async ({ input }) => {
            inputSpy(input);
            return { ok: true };
          },
        });
      }
      await new TestController().run(
        jsonRequest("http://localhost/", { name: "x" }),
        emptyCtx,
      );
      expect(inputSpy).toHaveBeenCalledWith({ name: "x" });
    });

    it("skips request validation when requestDto is omitted", async () => {
      class TestController extends BaseController {
        run = this.createRoute({
          responseDto: z.object({ a: z.number() }),
          handler: async () => ({ a: 1 }),
        });
      }
      const response = await new TestController().run(
        new NextRequest("http://localhost/"),
        emptyCtx,
      );
      expect(await response.json()).toEqual({ a: 1 });
    });

    it("skips response validation when responseDto is omitted", async () => {
      class TestController extends BaseController {
        run = this.createRoute({
          handler: async () => ({ loose: "value" }),
        });
      }
      const response = await new TestController().run(
        new NextRequest("http://localhost/"),
        emptyCtx,
      );
      expect(await response.json()).toEqual({ loose: "value" });
    });

    it("returns 400 when request body fails ZodError", async () => {
      const xBodySchema = z.object({ x: z.string() });
      class TestController extends BaseController {
        run = this.createRoute({
          requestDto: xBodySchema,
          inputType: InputType.Body,
          handler: async () => ({ ok: true }),
        });
      }
      const response = await new TestController().run(
        jsonRequest("http://localhost/", { x: 1 }),
        emptyCtx,
      );
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe("DTO validation failed");
      expect(String(json.details)).toContain("x");
    });

    it("returns 500 when response shape is invalid", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      class TestController extends BaseController {
        run = this.createRoute({
          responseDto: z.object({ ok: z.literal(true) }),
          handler: async () => ({ ok: false }) as { ok: boolean },
        });
      }
      const response = await new TestController().run(
        new NextRequest("http://localhost/"),
        emptyCtx,
      );
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        error: "Unexpected response shape",
      });
      consoleSpy.mockRestore();
    });

    it("returns mapped status when handler throws HttpError", async () => {
      class TestController extends BaseController {
        run = this.createRoute({
          handler: async () => {
            throw new HttpError(418, "short and stout");
          },
        });
      }
      const response = await new TestController().run(
        new NextRequest("http://localhost/"),
        emptyCtx,
      );
      expect(response.status).toBe(418);
      expect(await response.json()).toEqual({ error: "short and stout" });
    });

    it("returns 500 for unknown errors", async () => {
      class TestController extends BaseController {
        run = this.createRoute({
          handler: async () => {
            throw new Error("boom");
          },
        });
      }
      const response = await new TestController().run(
        new NextRequest("http://localhost/"),
        emptyCtx,
      );
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: "boom" });
    });

    it("passes empty input when requestDto is omitted", async () => {
      class TestController extends BaseController {
        run = this.createRoute({
          responseDto: z.object({ got: z.string() }),
          handler: async ({ input }) => ({
            got:
              input && Object.keys(input as object).length > 0
                ? "present"
                : "absent",
          }),
        });
      }
      const response = await new TestController().run(
        new NextRequest("http://localhost/"),
        emptyCtx,
      );
      expect(await response.json()).toEqual({ got: "absent" });
    });

    it("returns Response from handler without JSON validation", async () => {
      class TestController extends BaseController {
        run = this.createRoute({
          handler: async () => new NextResponse(null, { status: 204 }),
        });
      }
      const response = await new TestController().run(
        new NextRequest("http://localhost/"),
        emptyCtx,
      );
      expect(response.status).toBe(204);
    });
  });
});

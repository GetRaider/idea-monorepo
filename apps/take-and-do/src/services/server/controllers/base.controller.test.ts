import { NextRequest, NextResponse } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { HttpError } from "@/lib/api/errors";

import { BaseController, type NextAppRouteContext } from "./base.controller";

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

    it("validates request body and passes typed body to handler", async () => {
      const bodySpy = vi.fn();
      class TestController extends BaseController {
        run = this.createRoute({
          requestDto: z.object({ name: z.string() }),
          responseDto: z.object({ ok: z.literal(true) }),
          handler: async (_req, body) => {
            bodySpy(body);
            return { ok: true };
          },
        });
      }
      await new TestController().run(
        jsonRequest("http://localhost/", { name: "x" }),
        emptyCtx,
      );
      expect(bodySpy).toHaveBeenCalledWith({ name: "x" });
    });

    it("uses requestSource when provided instead of req.json()", async () => {
      const sourceSpy = vi.fn();
      class TestController extends BaseController {
        run = this.createRoute({
          requestDto: z.object({ n: z.number() }),
          requestSource: (req, ctx) => {
            sourceSpy(req, ctx);
            return { n: 7 };
          },
          responseDto: z.object({ n: z.number() }),
          handler: async (_req, body) => ({ n: body.n }),
        });
      }
      const response = await new TestController().run(
        new NextRequest("http://localhost/", { method: "GET" }),
        emptyCtx,
      );
      expect(sourceSpy).toHaveBeenCalled();
      expect(await response.json()).toEqual({ n: 7 });
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
      class TestController extends BaseController {
        run = this.createRoute({
          requestDto: z.object({ x: z.string() }),
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

    it("does not pass body argument to handler when requestDto is omitted", async () => {
      class TestController extends BaseController {
        run = this.createRoute({
          responseDto: z.object({ got: z.string() }),
          handler: async (_req, body) => ({
            got: body === undefined ? "undefined" : "defined",
          }),
        });
      }
      const response = await new TestController().run(
        new NextRequest("http://localhost/"),
        emptyCtx,
      );
      expect(await response.json()).toEqual({ got: "undefined" });
    });

    it("returns Response from handler without JSON validation", async () => {
      class TestController extends BaseController {
        run = this.createRoute({
          responseDto: z.object({ never: z.literal(true) }),
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

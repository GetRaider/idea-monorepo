import { describe, it, expect } from "@jest/globals";
import { urlHelper } from "../../helpers/url.helper";

describe("urlHelper", () => {
  describe("construct", () => {
    describe("basic functionality", () => {
      it.each([
        {
          name: "base only",
          args: { base: "/api/users" },
          expected: "/api/users",
        },
        {
          name: "base and single param",
          args: { base: "/api/users", params: ["123"] },
          expected: "/api/users/123",
        },
        {
          name: "base and multiple params",
          args: { base: "/api/users", params: ["123", "posts", "456"] },
          expected: "/api/users/123/posts/456",
        },
        {
          name: "base and single query",
          args: { base: "/api/users", queries: { page: 1 } },
          expected: "/api/users?page=1",
        },
        {
          name: "base and multiple queries",
          args: {
            base: "/api/users",
            queries: { page: 1, limit: 10, sort: "desc" },
          },
          expected: "/api/users?page=1&limit=10&sort=desc",
        },
        {
          name: "params and queries",
          args: {
            base: "/api/users",
            params: ["123", "posts"],
            queries: { page: 1, limit: 10 },
          },
          expected: "/api/users/123/posts?page=1&limit=10",
        },
        {
          name: "special characters in query values",
          args: {
            base: "/api/search",
            queries: { q: "hello world", filter: "type=user&status=active" },
          },
          expected:
            "/api/search?q=hello%20world&filter=type%3Duser%26status%3Dactive",
        },
        {
          name: "special characters in query keys",
          args: {
            base: "/api/search",
            queries: { "filter[type]": "user", "order[by]": "name" },
          },
          expected: "/api/search?filter%5Btype%5D=user&order%5Bby%5D=name",
        },
        {
          name: "numeric query values",
          args: {
            base: "/api/users",
            queries: { page: 1, limit: 100, offset: 0 },
          },
          expected: "/api/users?page=1&limit=100&offset=0",
        },
        {
          name: "empty params and queries",
          args: { base: "/api/users", params: [], queries: {} },
          expected: "/api/users",
        },
      ])("should construct URL with $name", ({ args, expected }) => {
        expect(urlHelper.construct(args)).toBe(expected);
      });
    });

    describe("shouldSkipMissingArgs option", () => {
      it("should skip empty params array", () => {
        const result = urlHelper.construct(
          { base: "/api/users", params: [] },
          { shouldSkipMissingArgs: true },
        );
        expect(result).toBe("/api/users");
      });

      it("should skip empty queries", () => {
        const result = urlHelper.construct(
          { base: "/api/users", queries: undefined as any },
          { shouldSkipMissingArgs: true },
        );
        expect(result).toBe("/api/users");
      });

      it.each([
        {
          name: "null param",
          args: { base: "/api/users", params: ["123", null as any, "posts"] },
        },
        {
          name: "undefined param",
          args: { base: "/api/users", params: ["123", undefined as any] },
        },
        {
          name: "empty string param",
          args: { base: "/api/users", params: ["123", ""] },
        },
      ])(
        "should throw error for $name when shouldSkipMissingArgs is false",
        ({ args }) => {
          expect(() => urlHelper.construct(args)).toThrow(
            "Some of passed params is null or undefined",
          );
        },
      );

      it.each([
        {
          name: "null query value",
          args: {
            base: "/api/users",
            queries: { page: 1, limit: null as any },
          },
        },
        {
          name: "undefined query value",
          args: {
            base: "/api/users",
            queries: { page: 1, limit: undefined as any },
          },
        },
        {
          name: "empty string query value",
          args: { base: "/api/users", queries: { page: 1, filter: "" } },
        },
      ])(
        "should throw error for $name when shouldSkipMissingArgs is false",
        ({ args }) => {
          expect(() => urlHelper.construct(args)).toThrow(
            "Some of passed queries is null or undefined",
          );
        },
      );
    });

    describe("shouldGetExistingArgs option", () => {
      it.each([
        {
          name: "params with null/undefined values",
          args: {
            base: "/api/users",
            params: ["123", null as any, "posts", undefined as any],
          },
          expected: "/api/users/123/posts",
        },
        {
          name: "all null/undefined params",
          args: { base: "/api/users", params: [null as any, undefined as any] },
          expected: "/api/users",
        },
        {
          name: "params with empty string",
          args: { base: "/api/users", params: ["123", "", "posts"] },
          expected: "/api/users/123/posts",
        },
      ])("should filter out falsy params: $name", ({ args, expected }) => {
        const result = urlHelper.construct(args, {
          shouldGetExistingArgs: true,
        });
        expect(result).toBe(expected);
      });

      it.each([
        {
          name: "queries with null/undefined values",
          args: {
            base: "/api/users",
            queries: { page: 1, limit: null as any, sort: "desc" },
          },
          expected: "/api/users?page=1&sort=desc",
        },
        {
          name: "all null/undefined queries",
          args: {
            base: "/api/users",
            queries: { page: null as any, limit: undefined as any },
          },
          expected: "/api/users",
        },
        {
          name: "queries with empty string",
          args: {
            base: "/api/users",
            queries: { page: 1, filter: "", sort: "desc" },
          },
          expected: "/api/users?page=1&sort=desc",
        },
        {
          name: "queries with zero values",
          args: { base: "/api/users", queries: { page: 0, limit: 10 } },
          expected: "/api/users?page=0&limit=10",
        },
      ])("should filter out falsy queries: $name", ({ args, expected }) => {
        const result = urlHelper.construct(args, {
          shouldGetExistingArgs: true,
        });
        expect(result).toBe(expected);
      });

      it("should handle both params and queries with falsy values", () => {
        const result = urlHelper.construct(
          {
            base: "/api/users",
            params: ["123", null as any, "posts"],
            queries: { page: 1, limit: null as any, sort: "desc" },
          },
          { shouldGetExistingArgs: true },
        );
        expect(result).toBe("/api/users/123/posts?page=1&sort=desc");
      });
    });

    describe("edge cases", () => {
      it.each([
        {
          name: "trailing slash",
          args: { base: "/api/users/", params: ["123"] },
          expected: "/api/users//123",
        },
        {
          name: "empty base",
          args: { base: "", params: ["users", "123"] },
          expected: "/users/123",
        },
        {
          name: "base without leading slash",
          args: { base: "api/users", params: ["123"] },
          expected: "api/users/123",
        },
      ])("should handle $name", ({ args, expected }) => {
        expect(urlHelper.construct(args)).toBe(expected);
      });
    });
  });

  describe("getQueryValues", () => {
    it.each([
      {
        name: "single query value",
        url: "https://example.com/api/users?page=1",
        keys: ["page"],
        expected: { page: "1" },
      },
      {
        name: "multiple query values",
        url: "https://example.com/api/users?page=1&limit=10&sort=desc",
        keys: ["page", "limit", "sort"],
        expected: { page: "1", limit: "10", sort: "desc" },
      },
      {
        name: "missing query parameters",
        url: "https://example.com/api/users?page=1",
        keys: ["page", "limit", "sort"],
        expected: { page: "1", limit: null, sort: null },
      },
      {
        name: "empty query keys array",
        url: "https://example.com/api/users?page=1&limit=10",
        keys: [],
        expected: {},
      },
      {
        name: "URL with no query parameters",
        url: "https://example.com/api/users",
        keys: ["page", "limit"],
        expected: { page: null, limit: null },
      },
      {
        name: "URL-encoded query values",
        url: "https://example.com/api/search?q=hello%20world&filter=type%3Duser",
        keys: ["q", "filter"],
        expected: { q: "hello world", filter: "type=user" },
      },
      {
        name: "empty query parameter values",
        url: "https://example.com/api/users?page=&limit=10",
        keys: ["page", "limit"],
        expected: { page: "", limit: "10" },
      },
      {
        name: "special characters in query parameters",
        url: "https://example.com/api/search?filter[type]=user&order[by]=name",
        keys: ["filter[type]", "order[by]"],
        expected: { "filter[type]": "user", "order[by]": "name" },
      },
      {
        name: "duplicate query parameter keys (returns first)",
        url: "https://example.com/api/users?tag=javascript&tag=typescript",
        keys: ["tag"],
        expected: { tag: "javascript" },
      },
      {
        name: "numeric-looking values as strings",
        url: "https://example.com/api/users?page=1&limit=100",
        keys: ["page", "limit"],
        expected: { page: "1", limit: "100" },
      },
      {
        name: "localhost URLs",
        url: "http://localhost:3000/api/users?page=1&limit=10",
        keys: ["page", "limit"],
        expected: { page: "1", limit: "10" },
      },
      {
        name: "URLs with hash fragments",
        url: "https://example.com/api/users?page=1#section",
        keys: ["page"],
        expected: { page: "1" },
      },
    ])("should extract $name", ({ url, keys, expected }) => {
      expect(urlHelper.getQueryValues(url, keys)).toEqual(expected);
    });
  });
});

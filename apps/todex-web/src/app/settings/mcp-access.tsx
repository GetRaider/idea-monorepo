"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@repo/ui";

import { authClient } from "@lib/auth-client";
import { env } from "@lib/env";

export function McpAccessSettings() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [write, setWrite] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const tokens = useQuery({
    queryKey: ["mcp-tokens"],
    queryFn: async () => {
      const result = await authClient.apiKey.list();
      if (result.error) throw new Error(result.error.message ?? "Could not list tokens");
      return result.data ?? [];
    },
  });
  const createToken = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${env.api.baseUrl}/api/auth/mcp-token/create`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), write }),
      });
      const body = (await response.json().catch(() => null)) as {
        key?: string;
        message?: string;
      } | null;
      const key = body?.key;
      if (!response.ok || !key) {
        throw new Error(body?.message ?? "Could not create token");
      }
      return { key };
    },
    onSuccess: async (data) => {
      setCreatedKey(data.key);
      setName("");
      await queryClient.invalidateQueries({ queryKey: ["mcp-tokens"] });
    },
  });
  const revokeToken = useMutation({
    mutationFn: async (keyId: string) => {
      const result = await authClient.apiKey.delete({ keyId });
      if (result.error) throw new Error(result.error.message ?? "Could not revoke token");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["mcp-tokens"] });
    },
  });

  const rows = tokens.data ?? [];

  return (
    <section className="mt-6 max-w-lg rounded-xl border border-border p-4">
      <h2 className="text-sm font-medium">MCP access</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Personal tokens let Cursor, Claude, or ChatGPT call Todex as you. A new
        token is shown once.
      </p>
      <form
        className="mt-4 flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setCreatedKey(null);
          createToken.mutate();
        }}
      >
        <label className="flex flex-col gap-1 text-sm">
          Name
          <input
            className="rounded-md border border-border bg-transparent px-3 py-2"
            value={name}
            maxLength={32}
            required
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={write}
            onChange={(event) => setWrite(event.target.checked)}
          />
          Allow writes
        </label>
        <Button type="submit" size="sm" disabled={createToken.isPending || name.trim().length === 0}>
          Create token
        </Button>
        {createToken.error ? (
          <p className="text-sm text-destructive">{createToken.error.message}</p>
        ) : null}
      </form>
      {createdKey ? (
        <div className="mt-4 rounded-md border border-border p-3">
          <p className="text-xs text-muted-foreground">
            Copy this token now. It will not be shown again.
          </p>
          <p className="mt-2 break-all font-mono text-sm">{createdKey}</p>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="mt-2"
            onClick={() => void navigator.clipboard.writeText(createdKey)}
          >
            Copy
          </Button>
        </div>
      ) : null}
      <div className="mt-4">
        {tokens.isPending ? (
          <p className="text-sm text-muted-foreground">Loading tokens…</p>
        ) : tokens.isError ? (
          <p className="text-sm text-destructive">{tokens.error.message}</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">You have no MCP tokens.</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((token) => (
              <li key={token.id} className="flex items-start justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium">{token.name ?? "Token"}</p>
                  <p className="text-muted-foreground">
                    {token.start ?? token.prefix ?? "tdx_"} · {scopeLabel(token.permissions)}
                    {token.expiresAt
                      ? ` · expires ${new Date(token.expiresAt).toLocaleDateString()}`
                      : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={revokeToken.isPending}
                  onClick={() => {
                    if (window.confirm(`Revoke ${token.name ?? "this token"}?`)) {
                      revokeToken.mutate(token.id);
                    }
                  }}
                >
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function scopeLabel(permissions: unknown): string {
  const parsed = parsePermissions(permissions);
  const actions = parsed.mcp ?? [];
  return actions.includes("write") ? "read and write" : "read";
}

function parsePermissions(value: unknown): { mcp?: string[] } {
  if (typeof value === "string") {
    try {
      return parsePermissions(JSON.parse(value));
    } catch {
      return {};
    }
  }
  if (!value || typeof value !== "object" || !("mcp" in value)) return {};
  const actions = (value as { mcp?: unknown }).mcp;
  if (!Array.isArray(actions)) return {};
  return { mcp: actions.filter((action) => typeof action === "string") };
}

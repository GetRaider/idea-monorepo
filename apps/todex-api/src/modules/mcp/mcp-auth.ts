import {
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { auth } from "../../auth";
import { oauthAccessTokens } from "../../db/auth-schema";
import { ensureOwnerWorkspace } from "../../db/ensure-workspace";
import { workspaceMembers } from "../../db/schema";
import { DRIZZLE_DB } from "../../db/tokens";
import { env } from "../../env/env";

export const WWW_AUTHENTICATE = `Bearer resource_metadata="${env.api.baseUrl}/.well-known/oauth-protected-resource"`;

@Injectable()
export class McpAuthService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: NodePgDatabase) {}

  async authenticate(authorization: string | undefined): Promise<McpCaller> {
    const token = bearer(authorization);
    if (!token) throw new UnauthorizedException("Not authenticated");

    const oauth = await this.oauthCaller(token);
    const caller = oauth ?? (await this.apiKeyCaller(token));
    if (!caller) throw new UnauthorizedException("Not authenticated");

    const workspaceId = await this.workspaceId(caller.userId);
    return { ...caller, workspaceId };
  }

  private async oauthCaller(token: string): Promise<TokenCaller | null> {
    const [row] = await this.db
      .select()
      .from(oauthAccessTokens)
      .where(eq(oauthAccessTokens.accessToken, token))
      .limit(1);
    if (!row?.userId) return null;
    if (row.accessTokenExpiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException("Not authenticated");
    }
    return { userId: row.userId, scopes: parseScopes(row.scopes) };
  }

  private async apiKeyCaller(token: string): Promise<TokenCaller | null> {
    try {
      const result = await auth.api.verifyApiKey({ body: { key: token } });
      if (!result.valid || !result.key) return null;
      const permissions = readPermissions(result.key.permissions);
      const actions = permissions.mcp ?? [];
      const scopes = new Set<McpScope>();
      if (actions.includes("read") || actions.includes("write")) scopes.add("todex:read");
      if (actions.includes("write")) scopes.add("todex:write");
      return { userId: result.key.userId, scopes };
    } catch {
      return null;
    }
  }

  private async workspaceId(userId: string): Promise<string> {
    let memberships = await this.db
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, userId));
    if (memberships.length === 0) {
      await ensureOwnerWorkspace(this.db, userId);
      memberships = await this.db
        .select()
        .from(workspaceMembers)
        .where(eq(workspaceMembers.userId, userId));
    }
    if (memberships.length !== 1 || !memberships[0]) {
      throw new ForbiddenException("Expected exactly one workspace membership");
    }
    return memberships[0].workspaceId;
  }
}

export function hasScope(caller: McpCaller, scope: McpScope): boolean {
  if (caller.scopes.has("todex:write")) return true;
  return caller.scopes.has(scope);
}

function bearer(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

function parseScopes(value: string): Set<McpScope> {
  const scopes = new Set<McpScope>();
  for (const scope of value.split(" ")) {
    if (scope === "todex:read" || scope === "todex:write") scopes.add(scope);
  }
  if (scopes.has("todex:write")) scopes.add("todex:read");
  return scopes;
}

function readPermissions(value: unknown): Record<string, string[]> {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      return readPermissions(JSON.parse(value));
    } catch {
      return {};
    }
  }
  if (typeof value !== "object") return {};
  const record: Record<string, string[]> = {};
  for (const [key, actions] of Object.entries(value)) {
    if (Array.isArray(actions)) {
      record[key] = actions.filter((action) => typeof action === "string");
    }
  }
  return record;
}

export type McpScope = "todex:read" | "todex:write";

interface TokenCaller {
  userId: string;
  scopes: Set<McpScope>;
}

export interface McpCaller extends TokenCaller {
  workspaceId: string;
}

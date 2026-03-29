/**
 * UUID for client-only code paths (guest localStorage, etc.).
 * `@/lib/db/modules/utils` uses `node:crypto` and must not be imported in client components.
 */
export function generateId(): string {
  return globalThis.crypto.randomUUID();
}

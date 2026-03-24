/**
 * One-time fix when the database already has tables (e.g. from `drizzle-kit push`)
 * but `drizzle.__drizzle_migrations` is empty — `drizzle-kit migrate` would replay
 * 0000 and fail on "type already exists".
 *
 * Inserts a row for migrations 0000–0002 so only 0003+ run. Safe to run only when
 * `drizzle.__drizzle_migrations` has zero rows (or exits early if already populated).
 */
import "dotenv/config";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const LAST_BASELINE_TAG = "0002_remove_schedule_column";
const LAST_BASELINE_CREATED_AT = 1765710832700;

function migrationHash(sqlFile: string): string {
  const fullPath = path.join(process.cwd(), "drizzle", sqlFile);
  const query = fs.readFileSync(fullPath, "utf8");
  return createHash("sha256").update(query).digest("hex");
}

async function main(): Promise<void> {
  const connectionString = process.env.DB_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error("Set DB_CONNECTION_STRING");
  }

  const client = new pg.Client({ connectionString });
  await client.connect();

  try {
    await client.query(`CREATE SCHEMA IF NOT EXISTS drizzle`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `);

    const count = await client.query(
      `SELECT COUNT(*)::int AS cnt FROM drizzle.__drizzle_migrations`,
    );
    const rowCount = count.rows[0]?.cnt ?? 0;
    if (rowCount > 0) {
      console.log(
        `[baseline] drizzle.__drizzle_migrations already has ${rowCount} row(s). Skip.`,
      );
      return;
    }

    const hash = migrationHash(`${LAST_BASELINE_TAG}.sql`);
    await client.query(
      `INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)`,
      [hash, LAST_BASELINE_CREATED_AT],
    );
    console.log(
      `[baseline] Marked migrations through ${LAST_BASELINE_TAG} as applied (hash=${hash.slice(0, 12)}…). Run: pnpm db:migrate`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

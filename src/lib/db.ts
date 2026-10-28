import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

export type DbUser = {
  id: string;
  email: string;
  password_hash: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
};

export type DbSession = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
};

export type DbArg = string | number | boolean | null;
export type DbStatement = { sql: string; args?: DbArg[] };

type Sql = postgres.Sql;

declare global {
  // eslint-disable-next-line no-var
  var __deputetiDb: Sql | undefined;
  // eslint-disable-next-line no-var
  var __deputetiDbReady: Promise<void> | undefined;
}

// Supabase Postgres connection string. DATABASE_URL is preferred; POSTGRES_URL is
// what the Vercel ↔ Supabase integration sets automatically.
function resolveDbUrl(): URL {
  const raw = (process.env.DATABASE_URL || process.env.POSTGRES_URL || "").trim();
  if (!raw) {
    throw new Error(
      "Database is not configured. Set DATABASE_URL to your Supabase connection string."
    );
  }
  const url = new URL(raw);
  // Drop query params (e.g. sslmode, supa=...) that the driver would otherwise
  // forward to the server as unknown settings; SSL is configured below.
  url.search = "";
  return url;
}

function getClient(): Sql {
  if (!globalThis.__deputetiDb) {
    const url = resolveDbUrl();
    const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    globalThis.__deputetiDb = postgres(url.toString(), {
      ssl: isLocal ? false : "require",
      // Required for Supabase's transaction pooler (port 6543), which Vercel should use.
      prepare: false,
      max: 1,
      idle_timeout: 20,
    });
  }
  return globalThis.__deputetiDb;
}

// Applies db/schema.sql once per server instance. Every statement is idempotent,
// and the advisory lock stops concurrent cold starts from racing each other.
async function ensureSchema(sql: Sql): Promise<void> {
  const schemaPath = path.resolve(process.cwd(), "db", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  await sql.begin(async (tx) => {
    await tx.unsafe("SELECT pg_advisory_xact_lock(724001)");
    await tx.unsafe(schema);
  });
}

export async function getDb(): Promise<Sql> {
  const sql = getClient();
  if (!globalThis.__deputetiDbReady) {
    globalThis.__deputetiDbReady = ensureSchema(sql).catch((error) => {
      globalThis.__deputetiDbReady = undefined;
      throw error;
    });
  }
  await globalThis.__deputetiDbReady;
  return sql;
}

// Queries are written with `?` placeholders; Postgres expects $1, $2, ...
function toPgPlaceholders(query: string): string {
  let index = 0;
  return query.replace(/\?/g, () => `$${++index}`);
}

export async function dbGet<T>(query: string, args: DbArg[] = []): Promise<T | undefined> {
  const sql = await getDb();
  const rows = await sql.unsafe(toPgPlaceholders(query), args);
  return rows[0] as T | undefined;
}

export async function dbAll<T>(query: string, args: DbArg[] = []): Promise<T[]> {
  const sql = await getDb();
  const rows = await sql.unsafe(toPgPlaceholders(query), args);
  return rows as unknown as T[];
}

export async function dbRun(query: string, args: DbArg[] = []): Promise<number> {
  const sql = await getDb();
  const result = await sql.unsafe(toPgPlaceholders(query), args);
  return result.count;
}

export async function dbTransaction(statements: DbStatement[]): Promise<void> {
  const sql = await getDb();
  await sql.begin(async (tx) => {
    for (const statement of statements) {
      await tx.unsafe(toPgPlaceholders(statement.sql), statement.args ?? []);
    }
  });
}

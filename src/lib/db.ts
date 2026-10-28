import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

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

declare global {
  // eslint-disable-next-line no-var
  var __deputetiDb: Database.Database | undefined;
}

function resolveDbPath(): string {
  const configured = process.env.DATABASE_PATH?.trim();
  if (configured) {
    return path.isAbsolute(configured) ? configured : path.resolve(process.cwd(), configured);
  }
  return path.resolve(process.cwd(), "data", "deputeti.db");
}

export function getDb(): Database.Database {
  if (globalThis.__deputetiDb) {
    return globalThis.__deputetiDb;
  }

  const dbPath = resolveDbPath();
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(dbPath)) {
    throw new Error(
      `Database not found at ${dbPath}. Run \`npm run db:init\` to create it from db/schema.sql.`
    );
  }

  const db = new Database(dbPath);
  db.pragma("foreign_keys = ON");
  globalThis.__deputetiDb = db;
  return db;
}

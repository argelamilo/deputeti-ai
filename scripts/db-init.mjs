import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const schemaPath = path.join(root, "db", "schema.sql");

const raw = (process.env.DATABASE_URL || process.env.POSTGRES_URL || "").trim();
if (!raw) {
  console.error("Set DATABASE_URL to your Supabase connection string.");
  process.exit(1);
}

const url = new URL(raw);
url.search = "";
const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
const sql = postgres(url.toString(), { ssl: isLocal ? false : "require", prepare: false, max: 1 });

try {
  await sql.unsafe(fs.readFileSync(schemaPath, "utf8"));
  console.log(`Database ready: ${url.host}`);
} finally {
  await sql.end();
}

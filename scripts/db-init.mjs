import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const schemaPath = path.join(root, "db", "schema.sql");
const defaultDbPath = path.join(root, "data", "deputeti.db");
const dbPath = process.env.DATABASE_PATH
  ? path.resolve(root, process.env.DATABASE_PATH)
  : defaultDbPath;

if (!fs.existsSync(schemaPath)) {
  console.error(`Schema not found: ${schemaPath}`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const schema = fs.readFileSync(schemaPath, "utf8");
const db = new Database(dbPath);

try {
  db.exec(schema);
  console.log(`Database ready: ${dbPath}`);
} finally {
  db.close();
}

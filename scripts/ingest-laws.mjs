// Loads law texts into the law_chunks table so the assistant can retrieve them.
// Usage: put .txt / .md / .html / .pdf files in data/laws, describe them in data/laws/manifest.json, then run:
//   npm run laws:ingest             (loads into the database)
//   npm run laws:ingest -- --dry-run (only shows how each file splits into passages)
// Re-running replaces the passages of every act listed in the manifest.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const lawsDir = path.join(root, "data", "laws");
const manifestPath = path.join(lawsDir, "manifest.json");
const MAX_CHUNK_CHARS = 1500;

// Keep in sync with normalizeForSearch in src/lib/lawSearch.ts.
export function normalizeForSearch(text) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

const ENTITIES = { "&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&apos;": "'" };

export function htmlToText(html) {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<\/(p|div|tr|li|h[1-6]|table|section)>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(nbsp|amp|lt|gt|quot|apos|#39);/g, (m) => ENTITIES[m] ?? m)
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/[ \t ]+/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();
}

// Extracts the text layer of a PDF. Scanned PDFs have no text layer and come back (nearly) empty.
export async function pdfToText(filePath) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true, disableFontFace: true, verbosity: 0 }).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    let line = "";
    for (const item of content.items) {
      line += item.str;
      if (item.hasEOL) line += "\n";
      else if (item.str && !line.endsWith(" ")) line += " ";
    }
    pages.push(line);
  }
  await doc.destroy();
  return pages.join("\n\n").replace(/[ \t]+\n/g, "\n");
}

// Splits on "Article 12" / "Neni 12" headings; very long articles are split further by paragraph.
export function chunkLaw(text) {
  const heading = /^\s*(Article|Neni)\s+(\d+[a-z]?)\b.*$/gim;
  const marks = [...text.matchAll(heading)].map((m) => ({ index: m.index, label: `${m[1]} ${m[2]}` }));
  const sections = [];
  if (marks.length === 0) {
    sections.push({ article: null, body: text });
  } else {
    if (marks[0].index > 0) sections.push({ article: null, body: text.slice(0, marks[0].index) });
    marks.forEach((mark, i) => {
      const end = i + 1 < marks.length ? marks[i + 1].index : text.length;
      sections.push({ article: mark.label, body: text.slice(mark.index, end) });
    });
  }

  const chunks = [];
  for (const { article, body } of sections) {
    const clean = body.trim();
    if (clean.length < 30) continue;
    if (clean.length <= MAX_CHUNK_CHARS) {
      chunks.push({ article, content: clean });
      continue;
    }
    let current = "";
    for (const paragraph of clean.split(/\n\s*\n/)) {
      if (current && current.length + paragraph.length > MAX_CHUNK_CHARS) {
        chunks.push({ article, content: current.trim() });
        current = "";
      }
      current += `${paragraph}\n\n`;
    }
    if (current.trim()) chunks.push({ article, content: current.trim() });
  }
  return chunks;
}

async function loadText(entry) {
  const filePath = path.join(lawsDir, entry.file);
  if (!fs.existsSync(filePath)) return null;
  if (/\.pdf$/i.test(entry.file)) return pdfToText(filePath);
  const text = fs.readFileSync(filePath, "utf8");
  return /\.html?$/i.test(entry.file) ? htmlToText(text) : text;
}

async function dryRun(manifest) {
  for (const entry of manifest) {
    const text = await loadText(entry);
    if (text === null) {
      console.log(`${entry.file}: FILE NOT FOUND`);
      continue;
    }
    const chunks = chunkLaw(text);
    const articles = new Set(chunks.map((c) => c.article).filter(Boolean));
    console.log(`${entry.file}: ${text.length} chars, ${chunks.length} passages, ${articles.size} articles`);
  }
}

async function main() {
  if (process.argv.includes("--dry-run")) {
    if (!fs.existsSync(manifestPath)) {
      console.error(`Missing ${manifestPath}. See data/laws/README.md.`);
      process.exit(1);
    }
    await dryRun(JSON.parse(fs.readFileSync(manifestPath, "utf8")));
    return;
  }
  const raw = (process.env.DATABASE_URL || process.env.POSTGRES_URL || "").trim();
  if (!raw) {
    console.error("Set DATABASE_URL to your Supabase connection string.");
    process.exit(1);
  }
  if (!fs.existsSync(manifestPath)) {
    console.error(`Missing ${manifestPath}. See data/laws/README.md.`);
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  const url = new URL(raw);
  url.search = "";
  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  const sql = postgres(url.toString(), { ssl: isLocal ? false : "require", prepare: false, max: 1 });

  try {
    await sql.unsafe(fs.readFileSync(path.join(root, "db", "schema.sql"), "utf8"));
    let total = 0;
    for (const entry of manifest) {
      const text = await loadText(entry);
      if (text === null) {
        console.warn(`Skipping ${entry.file}: file not found`);
        continue;
      }

      const rows = chunkLaw(text).map((chunk) => ({
        jurisdiction: entry.jurisdiction,
        act_title: entry.title,
        act_ref: entry.ref,
        article: chunk.article,
        language: entry.language || "en",
        url: entry.url || null,
        content: chunk.content,
        search_text: normalizeForSearch(`${entry.title} ${chunk.article ?? ""} ${chunk.content}`),
      }));
      if (rows.length === 0) {
        console.warn(`Skipping ${entry.file}: no text found`);
        continue;
      }

      await sql.begin(async (tx) => {
        await tx`DELETE FROM law_chunks WHERE act_ref = ${entry.ref}`;
        await tx`INSERT INTO law_chunks ${tx(rows)}`;
      });
      total += rows.length;
      console.log(`${entry.title}: ${rows.length} passages`);
    }
    console.log(`Done. ${total} passages loaded into ${url.host}`);
  } finally {
    await sql.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}

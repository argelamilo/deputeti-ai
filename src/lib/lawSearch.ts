import { dbAll, dbGet } from "@/lib/db";

export type LawPassage = {
  id: number;
  jurisdiction: "eu" | "al";
  act_title: string;
  act_ref: string;
  article: string | null;
  url: string | null;
  content: string;
  rank: number;
};

// Keep in sync with normalizeForSearch in scripts/ingest-laws.mjs: both sides must normalise identically.
export function normalizeForSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

const STOPWORDS = new Set([
  "the", "and", "for", "are", "what", "how", "does", "must", "shall", "that", "this", "with", "from",
  "have", "has", "can", "any", "per", "not", "you", "your", "which", "when", "where", "who",
  "dhe", "per", "nje", "qe", "si", "cfare", "eshte", "jane", "ne", "te", "me", "nga", "ose", "por", "kjo", "ky",
]);

// Builds an OR query with prefix matching, e.g. "corporate taxes" -> "corpora:* | tax:*".
// There is no stemming for Albanian, so prefixes stand in for word endings.
export function buildTsQuery(text: string): string | null {
  const words = normalizeForSearch(text)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
  const unique = [...new Set(words)].slice(0, 12);
  if (unique.length === 0) return null;
  return unique.map((w) => `${w.length > 5 ? w.slice(0, w.length - 2) : w}:*`).join(" | ");
}

export const SEARCH_SQL = `
  SELECT id, jurisdiction, act_title, act_ref, article, url, content,
         ts_rank_cd(tsv, q) AS rank
  FROM law_chunks, to_tsquery('simple', ?) AS q
  WHERE tsv @@ q AND (?::text IS NULL OR jurisdiction = ?::text)
  ORDER BY rank DESC
  LIMIT ?`;

export async function searchLaws(
  queries: string[],
  jurisdiction: "eu" | "al" | null,
  limit = 8
): Promise<LawPassage[]> {
  const best = new Map<number, LawPassage>();
  for (const query of queries.slice(0, 4)) {
    const tsQuery = buildTsQuery(query);
    if (!tsQuery) continue;
    const rows = await dbAll<LawPassage>(SEARCH_SQL, [tsQuery, jurisdiction, jurisdiction, limit]);
    for (const row of rows) {
      const prev = best.get(row.id);
      if (!prev || row.rank > prev.rank) best.set(row.id, row);
    }
  }
  return [...best.values()].sort((a, b) => b.rank - a.rank).slice(0, limit);
}

// The retrieval tool is only offered to the model when there is something to search,
// so an empty database costs no extra model round trip.
let cachedHasData: { value: boolean; at: number } | null = null;

export async function hasLawData(): Promise<boolean> {
  if (cachedHasData && Date.now() - cachedHasData.at < 60_000) return cachedHasData.value;
  let value = false;
  try {
    value = Boolean(await dbGet(`SELECT 1 AS present FROM law_chunks LIMIT 1`));
  } catch {
    value = false;
  }
  cachedHasData = { value, at: Date.now() };
  return value;
}

import Anthropic from "@anthropic-ai/sdk";
import type { StoredChatMessage } from "@/lib/conversations";
import { hasLawData, searchLaws, type LawPassage } from "@/lib/lawSearch";

const MODEL = "claude-sonnet-5-5";
const MAX_HISTORY_MESSAGES = 10;
// Search turns can pause server-side and database lookups need a follow-up turn; cap the total.
const MAX_TURNS = 6;
// EU and Albanian law are both researched for every answer.
const MAX_SEARCHES = 3;
// Legal answers are short; a smaller cap keeps generation fast.
const MAX_OUTPUT_TOKENS = 6000;

export type LegalSourceFocus = "eu_law" | "albanian";

export type LegalSource = {
  label: string;
  title: string;
  reference: string;
  source_type: "web";
  text_preview?: string;
  data_source: LegalSourceFocus;
};

export type LegalAnswer = {
  id: string;
  content: string;
  sources: LegalSource[];
  refused: boolean;
};

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    throw new Error("ANTHROPIC_API_KEY is not set.");
  }
  if (!client) {
    client = new Anthropic({ timeout: 110_000, maxRetries: 1 });
  }
  return client;
}

function buildSystemPrompt(focus: LegalSourceFocus, useDatabase: boolean): string {
  const today = new Date().toISOString().slice(0, 10);
  const focusLine =
    focus === "albanian"
      ? "The user has selected Albanian law as the main focus: give extra detail on the current Albanian rules, but still state the EU position."
      : "The user has selected EU law as the main focus: give extra detail on the EU rules, but still state the current Albanian position.";

  const databaseRule = useDatabase
    ? `- A local database of official law texts is available through the search_law_database tool, and it comes first. Call it once at the start with 2 to 4 short keyword queries covering both the EU side and the Albanian side, written in English and in Albanian (the stored texts exist in both languages). Its passages are official text.
- Speed matters. If the database passages answer the point for a side (EU or Albania), write the answer from them straight away and do NOT call web_search for that side. Never use web_search just to double-check or confirm database passages. Call web_search only for a side where the database returned nothing relevant, and at most twice in total. The one exception is a question about recent changes or the latest amendments, where one web search is allowed.
- If the database passages cover the right law but not the exact detail asked, answer with what they say and state plainly what was not found; do not search the web for it unless a side has no passages at all.
`
    : "";

  return `You are Deputeti AI, a legal assistant that helps Albanian businesses prepare for Albania's possible accession to the European Union. Users ask how EU rules work and how Albanian law differs from them or must be adapted. Today's date is ${today}.

${focusLine}

Every substantive answer must compare the two legal systems:
1. EU position: what EU law requires or provides (the directive, regulation or standard, and what it says in practice, including concrete numbers such as rates, thresholds, deadlines or fines where they exist).
2. Albania today: what Albanian law currently provides on the same point, with the same level of concreteness (rates, thresholds, deadlines, fines).
3. Gap and adaptation: where the two differ, what Albanian businesses should expect to change or do to align with EU rules. If Albania already aligns, say so. If the EU has no harmonised rule on the point (for example, VAT rates are set by member states within EU limits, and direct taxes are national), say that and, where useful, give the range or typical figures across member states.

For example, if asked what tax rate a business pays, explain what the EU framework says (and what member states typically apply), then state the rate in force in Albania today, then explain the difference.

Rules:
${databaseRule}- Always research both sides. Run the EU search and the Albanian search together in the same step rather than one after another, and keep the total to a handful of searches. Use the web_search tool to find the current text for the EU rules and for the Albanian rules before answering. Never answer with a statement that you did not check Albanian law, never say you cannot give Albanian figures without looking them up, and never leave the Albanian side out. Laws change often, so do not rely on memory for rates, article numbers, wording or whether a law is in force.
- Prefer official sources: for EU law, eur-lex.europa.eu and other europa.eu sites; for Albanian law, qbz.gov.al (Qendra e Botimeve Zyrtare / Fletorja Zyrtare), parlament.al, tatime.gov.al, financa.gov.al, gjykatakushtetuese.gov.al and other *.gov.al sites. Use secondary sources only when no official source is available, and say so.
- Name the specific act (title, number and year) and the article(s) supporting each point, for both the EU and the Albanian side.
- Only if, after searching, a specific Albanian figure or provision cannot be verified from a reliable source, say that this particular point could not be confirmed and name the authority where the user can check it (for example the General Directorate of Taxation). Do not use this as a shortcut: try to find it first.
- Reply in the language the user writes in. If the user writes in Albanian, reply in standard Albanian.
- Be concise (aim for under 250 words unless the question needs more): start with a short direct answer that contains both the EU and the Albanian position, then the supporting legal basis.
- End with one short sentence noting that this is general legal information, not legal advice for a specific case.

Formatting:
- Use Markdown (short paragraphs, bullet lists where helpful). A short comparison table is welcome when comparing figures.
- Do not add a "Sources:" line or a list of links at the end; the app shows the cited sources separately.
- Do not use the headings "Direct Answer", "Legal Basis", "Legal Text", "Bazë Ligjore", "Burimi Ligjor", "Burimi i Konceptit" or "Lloji i Burimit".`;
}

// The client appends "\n\nref: abcd1234" to stored assistant messages; strip it before replaying.
function stripRefSuffix(content: string): string {
  return content.replace(/\n\nref: [a-z0-9]{8}\s*$/i, "").trim();
}

function buildMessages(history: StoredChatMessage[], prompt: string): Anthropic.Beta.BetaMessageParam[] {
  const turns = history
    .filter((m) => (m.role === "user" || m.role === "assistant") && m.content.trim())
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.role === "assistant" ? stripRefSuffix(m.content) : m.content,
    }))
    .filter((m) => m.content);

  // The conversation must start with a user turn.
  while (turns.length > 0 && turns[0].role !== "user") {
    turns.shift();
  }

  return [...turns, { role: "user", content: prompt }];
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function dbSourceFor(passage: LawPassage): LegalSource {
  const side = passage.jurisdiction === "eu" ? "EU" : "Albania";
  const title = `${side}: ${passage.act_title}${passage.article ? `, ${passage.article}` : ""}`;
  return {
    label: title,
    title,
    reference: passage.url || passage.act_ref,
    source_type: "web",
    text_preview: passage.content.slice(0, 300),
    data_source: passage.jurisdiction === "al" ? "albanian" : "eu_law",
  };
}

function collectSources(
  responses: Anthropic.Beta.BetaMessage[],
  focus: LegalSourceFocus,
  dbPassages: LawPassage[]
): LegalSource[] {
  const cited = new Map<string, LegalSource>();
  const searched = new Map<string, LegalSource>();

  for (const response of responses) {
    for (const block of response.content) {
      if (block.type === "text" && block.citations) {
        for (const citation of block.citations) {
          if (citation.type !== "web_search_result_location" || cited.has(citation.url)) continue;
          const title = citation.title?.trim() || hostnameOf(citation.url);
          cited.set(citation.url, {
            label: title,
            title,
            reference: citation.url,
            source_type: "web",
            text_preview: citation.cited_text,
            data_source: focus,
          });
        }
      } else if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
        for (const result of block.content) {
          if (searched.has(result.url)) continue;
          const title = result.title?.trim() || hostnameOf(result.url);
          searched.set(result.url, {
            label: title,
            title,
            reference: result.url,
            source_type: "web",
            data_source: focus,
          });
        }
      }
    }
  }

  // Prefer pages the answer actually cites; fall back to the top search results.
  const webSources = cited.size > 0 ? [...cited.values()] : [...searched.values()].slice(0, 5);
  // Passages retrieved from the local law database come first; they are what the answer was grounded on.
  const dbSources = dbPassages.slice(0, 4).map(dbSourceFor);
  const seen = new Set<string>();
  return [...dbSources, ...webSources]
    .filter((source) => (seen.has(source.reference) ? false : (seen.add(source.reference), true)))
    .slice(0, 12);
}

export type AnswerHooks = {
  // Called with answer text as it is written (only text that follows the last search).
  onDelta?: (text: string) => void;
  // Called when text already streamed turns out to be a preamble and must be discarded.
  onReset?: () => void;
};

type StreamState = { searchDone: boolean; emitted: boolean };

const LAW_DB_TOOL: Anthropic.Beta.BetaTool = {
  name: "search_law_database",
  description:
    "Keyword search over a local database of official EU and Albanian law texts (split by article). Returns the best matching passages with act, article and source URL.",
  input_schema: {
    type: "object",
    properties: {
      queries: {
        type: "array",
        items: { type: "string" },
        description: "2 to 4 short keyword queries, in English and Albanian, e.g. 'standard rate value added tax' and 'tvsh norma standarde'.",
      },
      jurisdiction: {
        type: "string",
        enum: ["eu", "al", "both"],
        description: "Restrict to EU or Albanian texts; default both.",
      },
    },
    required: ["queries"],
  },
};

function formatPassages(passages: LawPassage[]): string {
  if (passages.length === 0) {
    return "No matching passages in the local database. Use web_search for this question.";
  }
  return passages
    .map((p) => {
      const side = p.jurisdiction === "eu" ? "EU" : "Albania";
      const heading = `[${side}] ${p.act_title} (${p.act_ref})${p.article ? `, ${p.article}` : ""}${p.url ? ` - ${p.url}` : ""}`;
      return `${heading}\n${p.content.slice(0, 1500)}`;
    })
    .join("\n\n---\n\n");
}

async function runLawTool(
  block: Anthropic.Beta.BetaToolUseBlock,
  collected: LawPassage[]
): Promise<Anthropic.Beta.BetaToolResultBlockParam> {
  try {
    const input = (block.input ?? {}) as { queries?: unknown; jurisdiction?: unknown };
    const queries = Array.isArray(input.queries) ? input.queries.filter((q): q is string => typeof q === "string") : [];
    const jurisdiction = input.jurisdiction === "eu" || input.jurisdiction === "al" ? input.jurisdiction : null;
    const passages = await searchLaws(queries, jurisdiction);
    collected.push(...passages);
    return { type: "tool_result", tool_use_id: block.id, content: formatPassages(passages) };
  } catch (error) {
    console.error("Law database search failed:", error);
    return {
      type: "tool_result",
      tool_use_id: block.id,
      is_error: true,
      content: "The local law database is unavailable. Use web_search instead.",
    };
  }
}

async function runTurn(
  anthropic: Anthropic,
  system: string,
  messages: Anthropic.Beta.BetaMessageParam[],
  hooks: AnswerHooks | undefined,
  state: StreamState,
  useDatabase: boolean
): Promise<Anthropic.Beta.BetaMessage> {
  const stream = anthropic.beta.messages.stream({
    model: MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    system,
    messages,
    // The older search tool has no code-execution steps between searches, which made answers ~8s faster.
    tools: [
      { type: "web_search_20250305", name: "web_search", max_uses: MAX_SEARCHES },
      ...(useDatabase ? [LAW_DB_TOOL] : []),
    ],
    output_config: { effort: "low" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  });

  if (hooks?.onDelta) {
    const { onDelta, onReset } = hooks;
    stream.on("streamEvent", (event) => {
      if (event.type === "content_block_start") {
        const blockType = event.content_block.type;
        if (blockType === "server_tool_use" || blockType === "tool_use") {
          // Another search or code step is starting: anything shown so far was a preamble, not the answer.
          if (state.emitted) {
            onReset?.();
            state.emitted = false;
          }
          state.searchDone = false;
        } else if (blockType.endsWith("_tool_result")) {
          // Search and its helper code steps both produce *_tool_result blocks; the answer follows the last one.
          state.searchDone = true;
        }
      } else if (event.type === "content_block_delta" && event.delta.type === "text_delta" && state.searchDone) {
        state.emitted = true;
        onDelta(event.delta.text);
      }
    });
  }

  return stream.finalMessage();
}

export async function answerLegalQuestion(
  params: {
    prompt: string;
    history: StoredChatMessage[];
    focus: LegalSourceFocus;
  },
  hooks?: AnswerHooks
): Promise<LegalAnswer> {
  const anthropic = getClient();
  const messages = buildMessages(params.history, params.prompt);
  const useDatabase = await hasLawData();
  const system = buildSystemPrompt(params.focus, useDatabase);
  const responses: Anthropic.Beta.BetaMessage[] = [];
  const dbPassages: LawPassage[] = [];
  const state: StreamState = { searchDone: false, emitted: false };

  let response: Anthropic.Beta.BetaMessage;
  for (let turn = 0; ; turn++) {
    response = await runTurn(anthropic, system, messages, hooks, state, useDatabase);
    responses.push(response);
    if (turn + 1 >= MAX_TURNS) break;

    if (response.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: response.content });
    } else if (response.stop_reason === "tool_use") {
      const toolCalls = response.content.filter(
        (block): block is Anthropic.Beta.BetaToolUseBlock => block.type === "tool_use"
      );
      const results = await Promise.all(toolCalls.map((call) => runLawTool(call, dbPassages)));
      messages.push({ role: "assistant", content: response.content });
      messages.push({ role: "user", content: results });
      // Text written after the database lookup is the answer (unless another search starts).
      state.searchDone = true;
    } else {
      break;
    }
  }

  if (response.stop_reason === "refusal") {
    return {
      id: response.id,
      content:
        "Më vjen keq, nuk mund ta përpunoj këtë kërkesë. Ju lutem riformulojeni pyetjen. / Sorry, I can't help with this request. Please rephrase your question.",
      sources: [],
      refused: true,
    };
  }

  // Drop any "let me search..." preamble: keep only text written after the last search result.
  const blocks = responses.flatMap((r) => r.content);
  let lastSearchIndex = -1;
  blocks.forEach((block, index) => {
    if (block.type === "tool_use" || block.type.endsWith("_tool_result")) lastSearchIndex = index;
  });
  const content = blocks
    .slice(lastSearchIndex + 1)
    .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();

  return {
    id: response.id,
    content,
    sources: collectSources(responses, params.focus, dbPassages),
    refused: false,
  };
}

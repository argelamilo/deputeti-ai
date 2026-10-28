import Anthropic from "@anthropic-ai/sdk";
import type { StoredChatMessage } from "@/lib/conversations";

const MODEL = "claude-sonnet-5-5";
const MAX_HISTORY_MESSAGES = 20;
// Web-search turns can pause server-side; resume a few times before giving up.
const MAX_CONTINUATIONS = 3;
// EU and Albanian law are both researched for every answer.
const MAX_SEARCHES = 8;

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

function buildSystemPrompt(focus: LegalSourceFocus): string {
  const today = new Date().toISOString().slice(0, 10);
  const focusLine =
    focus === "albanian"
      ? "The user has selected Albanian law as the main focus: give extra detail on the current Albanian rules, but still state the EU position."
      : "The user has selected EU law as the main focus: give extra detail on the EU rules, but still state the current Albanian position.";

  return `You are Deputeti AI, a legal assistant that helps Albanian businesses prepare for Albania's possible accession to the European Union. Users ask how EU rules work and how Albanian law differs from them or must be adapted. Today's date is ${today}.

${focusLine}

Every substantive answer must compare the two legal systems:
1. EU position: what EU law requires or provides (the directive, regulation or standard, and what it says in practice, including concrete numbers such as rates, thresholds, deadlines or fines where they exist).
2. Albania today: what Albanian law currently provides on the same point, with the same level of concreteness (rates, thresholds, deadlines, fines).
3. Gap and adaptation: where the two differ, what Albanian businesses should expect to change or do to align with EU rules. If Albania already aligns, say so. If the EU has no harmonised rule on the point (for example, VAT rates are set by member states within EU limits, and direct taxes are national), say that and, where useful, give the range or typical figures across member states.

For example, if asked what tax rate a business pays, explain what the EU framework says (and what member states typically apply), then state the rate in force in Albania today, then explain the difference.

Rules:
- Always research both sides. Use the web_search tool to find the current text for the EU rules and for the Albanian rules before answering. Never answer with a statement that you did not check Albanian law, never say you cannot give Albanian figures without looking them up, and never leave the Albanian side out. Laws change often, so do not rely on memory for rates, article numbers, wording or whether a law is in force.
- Prefer official sources: for EU law, eur-lex.europa.eu and other europa.eu sites; for Albanian law, qbz.gov.al (Qendra e Botimeve Zyrtare / Fletorja Zyrtare), parlament.al, tatime.gov.al, financa.gov.al, gjykatakushtetuese.gov.al and other *.gov.al sites. Use secondary sources only when no official source is available, and say so.
- Name the specific act (title, number and year) and the article(s) supporting each point, for both the EU and the Albanian side.
- Only if, after searching, a specific Albanian figure or provision cannot be verified from a reliable source, say that this particular point could not be confirmed and name the authority where the user can check it (for example the General Directorate of Taxation). Do not use this as a shortcut: try to find it first.
- Reply in the language the user writes in. If the user writes in Albanian, reply in standard Albanian.
- Be concise: start with a short direct answer that contains both the EU and the Albanian position, then the supporting legal basis.
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

function collectSources(
  responses: Anthropic.Beta.BetaMessage[],
  focus: LegalSourceFocus
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
  const sources = cited.size > 0 ? [...cited.values()] : [...searched.values()].slice(0, 5);
  return sources.slice(0, 12);
}

export async function answerLegalQuestion(params: {
  prompt: string;
  history: StoredChatMessage[];
  focus: LegalSourceFocus;
}): Promise<LegalAnswer> {
  const anthropic = getClient();
  const messages = buildMessages(params.history, params.prompt);
  const system = buildSystemPrompt(params.focus);
  const responses: Anthropic.Beta.BetaMessage[] = [];

  let response = await anthropic.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    system,
    messages,
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: MAX_SEARCHES }],
    output_config: { effort: "medium" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  });
  responses.push(response);

  for (let i = 0; i < MAX_CONTINUATIONS && response.stop_reason === "pause_turn"; i++) {
    messages.push({ role: "assistant", content: response.content });
    response = await anthropic.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system,
      messages,
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: MAX_SEARCHES }],
      output_config: { effort: "medium" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    });
    responses.push(response);
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
    if (block.type === "web_search_tool_result") lastSearchIndex = index;
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
    sources: collectSources(responses, params.focus),
    refused: false,
  };
}

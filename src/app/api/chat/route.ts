import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/session";
import { getConversationForUser, upsertConversationForUser } from "@/lib/conversations";
import { answerLegalQuestion, type LegalAnswer } from "@/lib/legalAssistant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Web search + answer can take a while; allow up to 2 minutes on Vercel.
export const maxDuration = 120;

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 25;
const MAX_PROMPT_LENGTH = 6000;
const ALLOWED_SOURCES = new Set(["eu_law", "albanian"]);

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

type ChatProxyRequest = {
  prompt: string;
  source?: string;
  conversation_id?: string;
  session_id?: string;
};

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  current.count += 1;
  rateLimitStore.set(key, current);
  return false;
}

function sanitizePrompt(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const normalized = input.replace(/\u0000/g, "").trim();
  if (!normalized) return null;
  if (normalized.length > MAX_PROMPT_LENGTH) {
    return normalized.slice(0, MAX_PROMPT_LENGTH);
  }
  return normalized;
}

function normalizeSource(input: unknown): "eu_law" | "albanian" {
  if (typeof input !== "string") return "eu_law";
  const normalized = input.trim().toLowerCase();
  return ALLOWED_SOURCES.has(normalized) ? (normalized as "eu_law" | "albanian") : "eu_law";
}

function sanitizeSessionId(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const normalized = input.trim();
  if (!normalized || normalized.length > 120) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(normalized)) return null;
  return normalized;
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        { detail: "Too many requests. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    const body = (await request.json()) as Partial<ChatProxyRequest>;
    const prompt = sanitizePrompt(body.prompt);
    const source = normalizeSource(body.source);
    const localSessionId = sanitizeSessionId(body.session_id);
    if (!prompt) {
      return NextResponse.json({ detail: "Invalid request. Prompt is required." }, { status: 400 });
    }

    const sessionUser = await getUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ detail: "Authentication required." }, { status: 401 });
    }

    const existing = localSessionId ? await getConversationForUser(sessionUser.id, localSessionId) : null;
    let priorMessages = existing?.messages ?? [];
    const last = priorMessages[priorMessages.length - 1];
    // Client may have already persisted the user turn optimistically.
    if (last?.role === "user" && last.content === prompt) {
      priorMessages = priorMessages.slice(0, -1);
    }

    let answer: LegalAnswer;
    try {
      answer = await answerLegalQuestion({ prompt, history: priorMessages, focus: source });
    } catch (error) {
      console.error("Chat request to Claude failed:", error);
      if (error instanceof Anthropic.RateLimitError) {
        return NextResponse.json({ detail: "The assistant is busy. Please try again shortly." }, { status: 429 });
      }
      if (error instanceof Anthropic.APIConnectionTimeoutError) {
        return NextResponse.json({ detail: "Service timeout. Please try again." }, { status: 504 });
      }
      return NextResponse.json({ detail: "The assistant is unavailable. Please try again." }, { status: 502 });
    }

    if (!answer.content) {
      return NextResponse.json({ detail: "The assistant returned an empty answer. Please try again." }, { status: 502 });
    }

    if (localSessionId) {
      try {
        await upsertConversationForUser({
          userId: sessionUser.id,
          sessionId: localSessionId,
          messages: [
            ...priorMessages,
            { role: "user", content: prompt },
            { role: "assistant", content: answer.content, sources: answer.sources },
          ],
        });
      } catch {
        // Chat response still succeeds even if local persistence fails.
      }
    }

    const safeResponse = {
      id: `chatcmpl-${answer.id.replace(/^msg_/, "")}`,
      created: Math.floor(Date.now() / 1000),
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: answer.content,
          },
          finish_reason: answer.refused ? "content_filter" : "stop",
        },
      ],
      usage: undefined,
      sources: answer.sources,
      metadata: {
        data_source: source,
        via: "claude_web_search",
        session_id: localSessionId,
      },
    };

    return NextResponse.json(safeResponse, { status: 200 });
  } catch (error: unknown) {
    console.error("Chat route failed:", error);
    return NextResponse.json(
      { detail: "Service request failed. Please try again." },
      { status: 500 }
    );
  }
}

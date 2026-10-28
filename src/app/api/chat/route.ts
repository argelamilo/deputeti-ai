import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/session";
import { getUpstreamAuthHeader } from "@/lib/auth/upstream";
import {
  getConversationForUser,
  getUpstreamConversationId,
  upsertConversationForUser,
} from "@/lib/conversations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REQUEST_TIMEOUT_MS = 45000;
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

type UpstreamConversationCreateResponse = {
  id?: string;
};

type UpstreamConversationMessageResponse = {
  tracking_id?: string | number;
  assistant_message?: {
    id?: string;
    role?: string;
    content?: string;
    sources?: unknown;
    metadata?: unknown;
    created_at?: string;
  };
};

function getBackendBaseUrl(): string {
  let baseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "https://eu-law.deputeti.ai";
  if (baseUrl.includes("#")) {
    baseUrl = baseUrl.split("#")[0];
  }
  return baseUrl.replace(/\/$/, "");
}

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

function sanitizeConversationId(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const normalized = input.trim();
  if (!normalized) return null;
  return normalized.slice(0, 120);
}

function sanitizeSessionId(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const normalized = input.trim();
  if (!normalized || normalized.length > 120) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(normalized)) return null;
  return normalized;
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
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
    let conversationId = sanitizeConversationId(body.conversation_id);
    if (!prompt) {
      return NextResponse.json({ detail: "Invalid request. Prompt is required." }, { status: 400 });
    }

    const sessionUser = await getUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ detail: "Authentication required." }, { status: 401 });
    }

    if (!conversationId && localSessionId) {
      conversationId = getUpstreamConversationId(sessionUser.id, localSessionId);
    }

    let authHeader: string;
    try {
      authHeader = await getUpstreamAuthHeader();
    } catch {
      return NextResponse.json({ detail: "Upstream authentication failed." }, { status: 502 });
    }

    const backendBase = getBackendBaseUrl();
    const createConversation = async () => {
      const attempt = async () =>
        fetchWithTimeout(`${backendBase}/api/v1/conversations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({
            title: "Bisede e re",
            profile: "general",
            data_source: source,
          }),
          cache: "no-store",
        });

      let createConversationResponse = await attempt();
      if (createConversationResponse.status === 401) {
        try {
          authHeader = await getUpstreamAuthHeader(true);
        } catch {
          return {
            id: null,
            errorResponse: NextResponse.json(
              { detail: "Upstream authentication failed." },
              { status: 502 }
            ),
          };
        }
        createConversationResponse = await attempt();
      }

      if (!createConversationResponse.ok) {
        const createText = await createConversationResponse.text();
        return {
          id: null,
          errorResponse: NextResponse.json(
            { detail: createText || "Failed to create conversation." },
            { status: createConversationResponse.status }
          ),
        };
      }

      let createdConversation: UpstreamConversationCreateResponse | null = null;
      try {
        createdConversation = (await createConversationResponse.json()) as UpstreamConversationCreateResponse;
      } catch {
        createdConversation = null;
      }

      if (!createdConversation?.id) {
        return {
          id: null,
          errorResponse: NextResponse.json(
            { detail: "Invalid conversation creation response." },
            { status: 502 }
          ),
        };
      }

      return { id: createdConversation.id, errorResponse: null as NextResponse | null };
    };

    if (!conversationId) {
      const created = await createConversation();
      if (created.errorResponse) return created.errorResponse;
      conversationId = created.id;
    }
    if (!conversationId) {
      return NextResponse.json({ detail: "Conversation initialization failed." }, { status: 502 });
    }

    const sendMessage = async (cid: string) =>
      fetchWithTimeout(`${backendBase}/api/v1/conversations/${encodeURIComponent(cid)}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          content: prompt,
          data_source: source,
        }),
        cache: "no-store",
      });

    let sendMessageResponse = await sendMessage(conversationId);
    if (sendMessageResponse.status === 404) {
      const recreated = await createConversation();
      if (recreated.errorResponse) return recreated.errorResponse;
      if (!recreated.id) {
        return NextResponse.json({ detail: "Conversation recreation failed." }, { status: 502 });
      }
      conversationId = recreated.id;
      sendMessageResponse = await sendMessage(conversationId);
    }

    const sendMessageText = await sendMessageResponse.text();
    if (!sendMessageResponse.ok) {
      try {
        const parsedError = JSON.parse(sendMessageText);
        return NextResponse.json(parsedError, { status: sendMessageResponse.status });
      } catch {
        return NextResponse.json(
          { detail: sendMessageText || "Failed to get chat response." },
          { status: sendMessageResponse.status }
        );
      }
    }

    let parsedMessage: UpstreamConversationMessageResponse | null = null;
    try {
      parsedMessage = JSON.parse(sendMessageText) as UpstreamConversationMessageResponse;
    } catch {
      parsedMessage = null;
    }

    const assistant = parsedMessage?.assistant_message;
    const assistantContent = assistant?.content;
    if (!assistantContent) {
      return NextResponse.json({ detail: "Invalid conversation message response format." }, { status: 502 });
    }

    const syntheticId =
      assistant?.id ||
      (parsedMessage?.tracking_id ? `chatcmpl-${parsedMessage.tracking_id}` : `chatcmpl-${Date.now()}`);

    if (localSessionId) {
      try {
        const existing = getConversationForUser(sessionUser.id, localSessionId);
        let priorMessages = existing?.messages ?? [];
        const last = priorMessages[priorMessages.length - 1];
        // Client may have already persisted the user turn optimistically.
        if (last?.role === "user" && last.content === prompt) {
          priorMessages = priorMessages.slice(0, -1);
        }
        upsertConversationForUser({
          userId: sessionUser.id,
          sessionId: localSessionId,
          upstreamConversationId: conversationId,
          messages: [
            ...priorMessages,
            { role: "user", content: prompt },
            {
              role: "assistant",
              content: assistantContent,
              sources: assistant?.sources ?? [],
            },
          ],
        });
      } catch {
        // Chat response still succeeds even if local persistence fails.
      }
    }

    const safeResponse = {
      id: syntheticId,
      created: Math.floor(Date.now() / 1000),
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: assistantContent,
          },
          finish_reason: "stop",
        },
      ],
      usage: undefined,
      sources: assistant?.sources ?? [],
      metadata: {
        ...(assistant?.metadata && typeof assistant.metadata === "object" ? assistant.metadata : {}),
        data_source: source,
        via: "conversations_api",
        conversation_id: conversationId,
        session_id: localSessionId,
      },
    };

    return NextResponse.json(safeResponse, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ detail: "Service timeout. Please try again." }, { status: 504 });
    }

    return NextResponse.json(
      { detail: "Service request failed. Please try again." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/session";
import {
  deleteConversationForUser,
  getConversationForUser,
  StoredChatMessage,
  upsertConversationForUser,
} from "@/lib/conversations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MESSAGES = 500;
const MAX_CONTENT_LENGTH = 100_000;

function sanitizeSessionId(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 120) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return null;
  return trimmed;
}

function sanitizeMessages(input: unknown): StoredChatMessage[] | null {
  if (!Array.isArray(input)) return null;
  if (input.length > MAX_MESSAGES) return null;

  const messages: StoredChatMessage[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object") return null;
    const record = item as Record<string, unknown>;
    const role = record.role;
    const content = record.content;
    if (role !== "user" && role !== "assistant" && role !== "system") return null;
    if (typeof content !== "string") return null;
    const normalizedContent = content.replace(/\u0000/g, "");
    if (!normalizedContent || normalizedContent.length > MAX_CONTENT_LENGTH) return null;

    const message: StoredChatMessage = {
      role,
      content: normalizedContent,
    };

    if (record.sources !== undefined) {
      message.sources = record.sources;
    }
    if (Array.isArray(record.reasoningSteps)) {
      message.reasoningSteps = record.reasoningSteps.map((step) => String(step)).slice(0, 50);
    }

    messages.push(message);
  }

  return messages;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ detail: "Authentication required." }, { status: 401 });
    }

    const { sessionId: rawSessionId } = await context.params;
    const sessionId = sanitizeSessionId(rawSessionId);
    if (!sessionId) {
      return NextResponse.json({ detail: "Invalid session id." }, { status: 400 });
    }

    const conversation = getConversationForUser(user.id, sessionId);
    if (!conversation) {
      return NextResponse.json({ detail: "Conversation not found." }, { status: 404 });
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load conversation.";
    if (message.includes("Database not found")) {
      return NextResponse.json({ detail: message }, { status: 503 });
    }
    return NextResponse.json({ detail: "Failed to load conversation." }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ detail: "Authentication required." }, { status: 401 });
    }

    const { sessionId: rawSessionId } = await context.params;
    const sessionId = sanitizeSessionId(rawSessionId);
    if (!sessionId) {
      return NextResponse.json({ detail: "Invalid session id." }, { status: 400 });
    }

    const body = (await request.json()) as {
      messages?: unknown;
      upstream_conversation_id?: unknown;
    };

    const messages = sanitizeMessages(body.messages);
    if (!messages) {
      return NextResponse.json({ detail: "Invalid messages payload." }, { status: 400 });
    }

    const upstream =
      typeof body.upstream_conversation_id === "string"
        ? body.upstream_conversation_id.trim().slice(0, 120) || null
        : body.upstream_conversation_id === null
          ? null
          : undefined;

    const conversation = upsertConversationForUser({
      userId: user.id,
      sessionId,
      messages,
      upstreamConversationId: upstream,
    });

    return NextResponse.json({ conversation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save conversation.";
    if (message.includes("Database not found")) {
      return NextResponse.json({ detail: message }, { status: 503 });
    }
    return NextResponse.json({ detail: "Failed to save conversation." }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ detail: "Authentication required." }, { status: 401 });
    }

    const { sessionId: rawSessionId } = await context.params;
    const sessionId = sanitizeSessionId(rawSessionId);
    if (!sessionId) {
      return NextResponse.json({ detail: "Invalid session id." }, { status: 400 });
    }

    deleteConversationForUser(user.id, sessionId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete conversation.";
    if (message.includes("Database not found")) {
      return NextResponse.json({ detail: message }, { status: 503 });
    }
    return NextResponse.json({ detail: "Failed to delete conversation." }, { status: 500 });
  }
}

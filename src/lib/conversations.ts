import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";

export type StoredChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  sources?: unknown;
  reasoningSteps?: string[];
};

export type ConversationListItem = {
  session_id: string;
  preview: string;
  last_updated: string;
  message_count: number;
};

export type ConversationDetail = {
  session_id: string;
  upstream_conversation_id: string | null;
  preview: string;
  message_count: number;
  last_updated: string;
  messages: StoredChatMessage[];
};

type ConversationRow = {
  id: string;
  user_id: string;
  session_id: string;
  upstream_conversation_id: string | null;
  preview: string;
  message_count: number;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  sources_json: string | null;
  reasoning_steps_json: string | null;
  position: number;
  created_at: string;
};

function previewFromMessages(messages: StoredChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user" && m.content.trim());
  if (!firstUser) return "Bisede e re";
  return firstUser.content.trim().slice(0, 50);
}

function parseJsonUnknown(raw: string | null): unknown {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
}

function rowToMessage(row: MessageRow): StoredChatMessage {
  const sources = parseJsonUnknown(row.sources_json);
  const reasoningRaw = parseJsonUnknown(row.reasoning_steps_json);
  const reasoningSteps = Array.isArray(reasoningRaw)
    ? reasoningRaw.map((step) => String(step))
    : undefined;

  const role =
    row.role === "assistant" || row.role === "system" || row.role === "user"
      ? row.role
      : "assistant";

  return {
    role,
    content: row.content,
    ...(sources !== undefined ? { sources } : {}),
    ...(reasoningSteps ? { reasoningSteps } : {}),
  };
}

export function listConversationsForUser(userId: string): ConversationListItem[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT session_id, preview, updated_at, message_count
       FROM conversations
       WHERE user_id = ?
       ORDER BY updated_at DESC`
    )
    .all(userId) as Array<{
    session_id: string;
    preview: string;
    updated_at: string;
    message_count: number;
  }>;

  return rows.map((row) => ({
    session_id: row.session_id,
    preview: row.preview || "Bisede e re",
    last_updated: row.updated_at,
    message_count: row.message_count,
  }));
}

export function getConversationForUser(
  userId: string,
  sessionId: string
): ConversationDetail | null {
  const db = getDb();
  const conversation = db
    .prepare(
      `SELECT id, user_id, session_id, upstream_conversation_id, preview, message_count, created_at, updated_at
       FROM conversations
       WHERE user_id = ? AND session_id = ?
       LIMIT 1`
    )
    .get(userId, sessionId) as ConversationRow | undefined;

  if (!conversation) return null;

  const messages = db
    .prepare(
      `SELECT id, conversation_id, role, content, sources_json, reasoning_steps_json, position, created_at
       FROM conversation_messages
       WHERE conversation_id = ?
       ORDER BY position ASC`
    )
    .all(conversation.id) as MessageRow[];

  return {
    session_id: conversation.session_id,
    upstream_conversation_id: conversation.upstream_conversation_id,
    preview: conversation.preview,
    message_count: conversation.message_count,
    last_updated: conversation.updated_at,
    messages: messages.map(rowToMessage),
  };
}

export function upsertConversationForUser(params: {
  userId: string;
  sessionId: string;
  messages: StoredChatMessage[];
  upstreamConversationId?: string | null;
}): ConversationDetail {
  const db = getDb();
  const now = new Date().toISOString();
  const preview = previewFromMessages(params.messages);
  const messageCount = params.messages.length;

  const existing = db
    .prepare(
      `SELECT id, upstream_conversation_id FROM conversations
       WHERE user_id = ? AND session_id = ?
       LIMIT 1`
    )
    .get(params.userId, params.sessionId) as
    | { id: string; upstream_conversation_id: string | null }
    | undefined;

  const conversationId = existing?.id || randomUUID();
  const upstreamId =
    params.upstreamConversationId !== undefined
      ? params.upstreamConversationId
      : existing?.upstream_conversation_id || null;

  const tx = db.transaction(() => {
    if (existing) {
      db.prepare(
        `UPDATE conversations
         SET upstream_conversation_id = ?, preview = ?, message_count = ?, updated_at = ?
         WHERE id = ?`
      ).run(upstreamId, preview, messageCount, now, conversationId);
      db.prepare(`DELETE FROM conversation_messages WHERE conversation_id = ?`).run(conversationId);
    } else {
      db.prepare(
        `INSERT INTO conversations
          (id, user_id, session_id, upstream_conversation_id, preview, message_count, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        conversationId,
        params.userId,
        params.sessionId,
        upstreamId,
        preview,
        messageCount,
        now,
        now
      );
    }

    const insert = db.prepare(
      `INSERT INTO conversation_messages
        (id, conversation_id, role, content, sources_json, reasoning_steps_json, position, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );

    params.messages.forEach((message, index) => {
      const role =
        message.role === "assistant" || message.role === "system" || message.role === "user"
          ? message.role
          : "assistant";
      insert.run(
        randomUUID(),
        conversationId,
        role,
        message.content,
        message.sources !== undefined ? JSON.stringify(message.sources) : null,
        message.reasoningSteps !== undefined ? JSON.stringify(message.reasoningSteps) : null,
        index,
        now
      );
    });
  });

  tx();

  return {
    session_id: params.sessionId,
    upstream_conversation_id: upstreamId,
    preview,
    message_count: messageCount,
    last_updated: now,
    messages: params.messages,
  };
}

export function deleteConversationForUser(userId: string, sessionId: string): boolean {
  const db = getDb();
  const result = db
    .prepare(`DELETE FROM conversations WHERE user_id = ? AND session_id = ?`)
    .run(userId, sessionId);
  return result.changes > 0;
}

export function getUpstreamConversationId(userId: string, sessionId: string): string | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT upstream_conversation_id FROM conversations
       WHERE user_id = ? AND session_id = ?
       LIMIT 1`
    )
    .get(userId, sessionId) as { upstream_conversation_id: string | null } | undefined;
  return row?.upstream_conversation_id ?? null;
}

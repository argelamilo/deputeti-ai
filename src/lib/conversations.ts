import { randomUUID } from "node:crypto";
import { dbAll, dbGet, dbRun, dbTransaction, type DbStatement } from "@/lib/db";

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
  if (!firstUser) return "New chat";
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

export async function listConversationsForUser(userId: string): Promise<ConversationListItem[]> {
  const rows = await dbAll<{
    session_id: string;
    preview: string;
    updated_at: string;
    message_count: number;
  }>(
    `SELECT session_id, preview, updated_at, message_count
     FROM conversations
     WHERE user_id = ?
     ORDER BY updated_at DESC`,
    [userId]
  );

  return rows.map((row) => ({
    session_id: row.session_id,
    preview: row.preview || "New chat",
    last_updated: row.updated_at,
    message_count: Number(row.message_count),
  }));
}

export async function getConversationForUser(
  userId: string,
  sessionId: string
): Promise<ConversationDetail | null> {
  const conversation = await dbGet<ConversationRow>(
    `SELECT id, user_id, session_id, upstream_conversation_id, preview, message_count, created_at, updated_at
     FROM conversations
     WHERE user_id = ? AND session_id = ?
     LIMIT 1`,
    [userId, sessionId]
  );

  if (!conversation) return null;

  const messages = await dbAll<MessageRow>(
    `SELECT id, conversation_id, role, content, sources_json, reasoning_steps_json, position, created_at
     FROM conversation_messages
     WHERE conversation_id = ?
     ORDER BY position ASC`,
    [conversation.id]
  );

  return {
    session_id: conversation.session_id,
    upstream_conversation_id: conversation.upstream_conversation_id,
    preview: conversation.preview,
    message_count: Number(conversation.message_count),
    last_updated: conversation.updated_at,
    messages: messages.map(rowToMessage),
  };
}

export async function upsertConversationForUser(params: {
  userId: string;
  sessionId: string;
  messages: StoredChatMessage[];
  upstreamConversationId?: string | null;
}): Promise<ConversationDetail> {
  const now = new Date().toISOString();
  const preview = previewFromMessages(params.messages);
  const messageCount = params.messages.length;

  const existing = await dbGet<{ id: string; upstream_conversation_id: string | null }>(
    `SELECT id, upstream_conversation_id FROM conversations
     WHERE user_id = ? AND session_id = ?
     LIMIT 1`,
    [params.userId, params.sessionId]
  );

  const conversationId = existing?.id || randomUUID();
  const upstreamId =
    params.upstreamConversationId !== undefined
      ? params.upstreamConversationId
      : existing?.upstream_conversation_id || null;

  const statements: DbStatement[] = [];
  if (existing) {
    statements.push(
      {
        sql: `UPDATE conversations
              SET upstream_conversation_id = ?, preview = ?, message_count = ?, updated_at = ?
              WHERE id = ?`,
        args: [upstreamId, preview, messageCount, now, conversationId],
      },
      {
        sql: `DELETE FROM conversation_messages WHERE conversation_id = ?`,
        args: [conversationId],
      }
    );
  } else {
    statements.push({
      sql: `INSERT INTO conversations
              (id, user_id, session_id, upstream_conversation_id, preview, message_count, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [conversationId, params.userId, params.sessionId, upstreamId, preview, messageCount, now, now],
    });
  }

  params.messages.forEach((message, index) => {
    const role =
      message.role === "assistant" || message.role === "system" || message.role === "user"
        ? message.role
        : "assistant";
    statements.push({
      sql: `INSERT INTO conversation_messages
              (id, conversation_id, role, content, sources_json, reasoning_steps_json, position, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        randomUUID(),
        conversationId,
        role,
        message.content,
        message.sources !== undefined ? JSON.stringify(message.sources) : null,
        message.reasoningSteps !== undefined ? JSON.stringify(message.reasoningSteps) : null,
        index,
        now,
      ],
    });
  });

  await dbTransaction(statements);

  return {
    session_id: params.sessionId,
    upstream_conversation_id: upstreamId,
    preview,
    message_count: messageCount,
    last_updated: now,
    messages: params.messages,
  };
}

export async function deleteConversationForUser(userId: string, sessionId: string): Promise<boolean> {
  const changes = await dbRun(`DELETE FROM conversations WHERE user_id = ? AND session_id = ?`, [
    userId,
    sessionId,
  ]);
  return changes > 0;
}

export async function getUpstreamConversationId(userId: string, sessionId: string): Promise<string | null> {
  const row = await dbGet<{ upstream_conversation_id: string | null }>(
    `SELECT upstream_conversation_id FROM conversations
     WHERE user_id = ? AND session_id = ?
     LIMIT 1`,
    [userId, sessionId]
  );
  return row?.upstream_conversation_id ?? null;
}

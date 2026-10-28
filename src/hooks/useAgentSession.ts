import { useState, useCallback, useEffect } from "react";
import { chatClient, ChatMessage, ChatResponse } from "@/lib/api/client";
import type { ChatSource } from "@/lib/api/client";
import { devError, devLog, devWarn } from "@/lib/utils/logger";

export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sources?: ChatSource[];
  reasoningSteps?: string[];
}

export function useAgentSession(sessionId: string | null = null) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedUserMessage, setLastFailedUserMessage] = useState<string | null>(null);

  const loadConversationHistory = useCallback(async () => {
    if (!sessionId) {
      setMessages([]);
      return;
    }

    try {
      setError(null);
      const history = await chatClient.getConversationHistory(sessionId);
      const converted: AgentMessage[] = history.map((msg: ChatMessage) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
        timestamp: new Date().toISOString(),
        sources: msg.sources,
        reasoningSteps: msg.reasoningSteps,
      }));
      setMessages(converted);
    } catch (loadError) {
      console.error("Failed to load conversation history:", loadError);
      setError("Failed to load conversation history");
    }
  }, [sessionId]);

  useEffect(() => {
    void loadConversationHistory();
  }, [loadConversationHistory]);

  const sendMessage = useCallback(
    async (userMessage: string, overrideSessionId?: string): Promise<ChatResponse | null> => {
      if (!userMessage.trim()) return null;

      const activeSessionId = overrideSessionId || sessionId || "default";

      devLog("[useAgentSession] Sending message:", {
        message: userMessage.substring(0, 50),
        activeSessionId,
        overrideSessionId,
        hookSessionId: sessionId,
      });

      setLoading(true);
      setError(null);

      try {
        const userMsg: AgentMessage = {
          role: "user",
          content: userMessage,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMsg]);

        const conversationHistory = await chatClient.getConversationHistory(activeSessionId);
        const updatedHistoryWithUser: ChatMessage[] = [
          ...conversationHistory,
          { role: "user", content: userMessage },
        ];

        // Persist user turn immediately so the sidebar shows this chat even if upstream fails.
        await chatClient.saveSessionMessages(activeSessionId, updatedHistoryWithUser);
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("sessionUpdated", { detail: { sessionId: activeSessionId } })
          );
        }

        const cleanHistory = conversationHistory.filter((msg) => {
          const content = String(msg.content || "").toLowerCase();
          return (
            !content.includes("rag pipeline error") &&
            !content.includes("str object has no attribute") &&
            !content.includes("failed to send message") &&
            !content.includes("request failed")
          );
        });

        const response = await chatClient.sendMessage(userMessage, activeSessionId, cleanHistory);

        if (response && response.success && response.response) {
          setLastFailedUserMessage(null);
          const assistantMsg: AgentMessage = {
            role: "assistant",
            content: response.response,
            timestamp: new Date().toISOString(),
            sources: response.sources,
            reasoningSteps: response.reasoningSteps,
          };
          setMessages((prev) => [...prev, assistantMsg]);

          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("sessionUpdated", { detail: { sessionId: activeSessionId } })
            );
          }

          return response;
        }

        const errorContent =
          response?.error ||
          "Ndodhi nje gabim gjate perpunimit te kerkeses. Ju lutem provoni perseri.";

        const errorMsg: AgentMessage = {
          role: "assistant",
          content: errorContent,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
        setError(response?.error || "Deshtoi marrja e pergjigjes nga asistenti");
        setLastFailedUserMessage(userMessage);

        const historyWithError: ChatMessage[] = [
          ...updatedHistoryWithUser,
          { role: "assistant", content: errorContent },
        ];
        await chatClient.saveSessionMessages(activeSessionId, historyWithError);
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("sessionUpdated", { detail: { sessionId: activeSessionId } })
          );
        }

        return null;
      } catch (err) {
        devError("[useAgentSession] Request failed:", err);

        const errorMsg: AgentMessage = {
          role: "assistant",
          content: "Kerkesa deshtoi. Ju lutem provoni perseri.",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
        setLastFailedUserMessage(userMessage);

        try {
          const currentHistory = await chatClient.getConversationHistory(activeSessionId);
          const historyWithError: ChatMessage[] = [
            ...currentHistory,
            { role: "assistant", content: errorMsg.content },
          ];
          // Ensure the user message is present if early save somehow failed.
          const hasUser = historyWithError.some(
            (m) => m.role === "user" && m.content === userMessage
          );
          const toSave = hasUser
            ? historyWithError
            : [
                ...currentHistory,
                { role: "user" as const, content: userMessage },
                { role: "assistant" as const, content: errorMsg.content },
              ];
          await chatClient.saveSessionMessages(activeSessionId, toSave);
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("sessionUpdated", { detail: { sessionId: activeSessionId } })
            );
          }
        } catch (saveError) {
          devError("[useAgentSession] Error saving exception message:", saveError);
        }

        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  const deleteConversation = useCallback(async () => {
    if (!sessionId) {
      devWarn("Cannot delete conversation: no session ID");
      return;
    }

    try {
      setError(null);
      await chatClient.deleteConversation(sessionId);
      setMessages([]);
    } catch (deleteError) {
      devError("Failed to delete conversation:", deleteError);
      setError("Failed to delete conversation");
    }
  }, [sessionId]);

  const retryLastMessage = useCallback(async (): Promise<ChatResponse | null> => {
    if (!lastFailedUserMessage || loading) {
      return null;
    }
    return sendMessage(lastFailedUserMessage);
  }, [lastFailedUserMessage, loading, sendMessage]);

  return {
    messages,
    loading,
    error,
    lastFailedUserMessage,
    sendMessage,
    retryLastMessage,
    deleteConversation,
    refreshHistory: loadConversationHistory,
    clearError: () => setError(null),
  };
}

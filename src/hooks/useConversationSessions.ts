import { useState, useCallback, useEffect } from "react";
import { chatClient } from "@/lib/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { devError, devLog } from "@/lib/utils/logger";

export interface ConversationSession {
  session_id: string;
  preview: string;
  last_updated: string;
  message_count: number;
}

/**
 * Hook to manage per-user conversation sessions from the local DB API.
 */
export function useConversationSessions() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    if (!isAuthenticated) {
      setSessions([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const sessionsList = await chatClient.getConversationSessions();
      devLog(`[useConversationSessions] Loaded ${sessionsList.length} sessions from DB`);
      setSessions(sessionsList);
    } catch (err) {
      devError("Failed to load conversation sessions:", err);
      setError("Failed to load conversations");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (authLoading) return;
    void loadSessions();
  }, [authLoading, loadSessions]);

  useEffect(() => {
    const handleConversationCreated = () => {
      void loadSessions();
    };
    const handleSessionUpdated = () => {
      void loadSessions();
    };
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void loadSessions();
      }
    };

    window.addEventListener("conversationCreated", handleConversationCreated);
    window.addEventListener("sessionUpdated", handleSessionUpdated);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("conversationCreated", handleConversationCreated);
      window.removeEventListener("sessionUpdated", handleSessionUpdated);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadSessions]);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      setError(null);
      await chatClient.deleteConversation(sessionId);
      setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
      return true;
    } catch (err) {
      devError("Failed to delete conversation:", err);
      setError("Failed to delete conversation");
      return false;
    }
  }, []);

  const refreshSessions = useCallback(() => loadSessions(), [loadSessions]);

  return {
    sessions,
    loading,
    error,
    deleteSession,
    refreshSessions,
    clearError: () => setError(null),
  };
}

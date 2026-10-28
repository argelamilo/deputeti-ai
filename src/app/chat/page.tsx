"use client";

import * as React from "react";
import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import MenuIcon from "@mui/icons-material/Menu";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Drawer from "@mui/material/Drawer";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useAuth } from "@/contexts/AuthContext";
import { useAgentSession } from "@/hooks/useAgentSession";
import { Sidebar } from "@/components/navigation/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ComposerBar } from "@/components/chat/ComposerBar";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { PromptSuggestionGrid } from "@/components/chat/PromptSuggestionGrid";
import { TopToolbar } from "@/components/chat/TopToolbar";
import type { NavigationItem } from "@/types/dashboard";

function ChatPageContent() {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const chatContainerRef = React.useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const sessionParam = searchParams.get("session");

  const [input, setInput] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());
  const [selectedLawLabel, setSelectedLawLabel] = useState("Ligji i BE-se");
  const [focusInputSignal, setFocusInputSignal] = useState(0);
  const [animatedAssistantMessageId, setAnimatedAssistantMessageId] = useState<number | null>(null);
  const hasInitializedFromHistoryRef = React.useRef(false);
  const previousMessageCountRef = React.useRef(0);

  const router = useRouter();
  const { user: authUser, logout } = useAuth();

  // Responsive breakpoints
  const isMobile = useMediaQuery('(max-width:768px)');

  // ChatGPT-style session management:
  // - If URL has session param, use it (viewing existing conversation)
  // - If no session param, we're in "new chat" mode (sessionId = null)
  // - Session ID is created only when first message is sent
  const sessionId = React.useMemo(() => {
    return sessionParam || null; // null means "new conversation not yet started"
  }, [sessionParam]);
  
  const {
    messages: agentMessages,
    loading,
    error,
    lastFailedUserMessage,
    sendMessage,
    retryLastMessage,
  } = useAgentSession(sessionId);

  const displayMessages = useMemo(
    () =>
      agentMessages.map((msg, idx) => ({
        id: idx + 1,
        text: msg.content,
        fromUser: msg.role === "user",
        sources: msg.sources || [],
        reasoningSteps: msg.reasoningSteps || [],
      })),
    [agentMessages]
  );

  // Build navigation items (reserved for future app sections)
  const navigationItems = useMemo<NavigationItem[]>(() => [], []);

  // Format user for PageHeader
  const userForHeader = authUser ? {
    id: authUser.id || '',
    email: authUser.email || '',
  } : undefined;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages]);

  useEffect(() => {
    const mapLawToLabel = (value: string | null) => (value === "albanian" ? "Ligji Shqiptar" : "Ligji i BE-se");
    const storedLaw = typeof window !== "undefined" ? window.localStorage.getItem("selected_law") : null;
    setSelectedLawLabel(mapLawToLabel(storedLaw));

    const onSelectedLawUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ value?: string }>;
      setSelectedLawLabel(mapLawToLabel(customEvent.detail?.value || null));
    };

    window.addEventListener("selectedLawUpdated", onSelectedLawUpdated as EventListener);
    return () => window.removeEventListener("selectedLawUpdated", onSelectedLawUpdated as EventListener);
  }, []);

  useEffect(() => {
    // Existing sessions hydrate from localStorage; do not animate those old assistant messages.
    hasInitializedFromHistoryRef.current = sessionId === null;
    previousMessageCountRef.current = 0;
    setAnimatedAssistantMessageId(null);
  }, [sessionId]);

  useEffect(() => {
    const currentCount = displayMessages.length;

    // Wait for initial history population for existing sessions.
    if (!hasInitializedFromHistoryRef.current) {
      if (currentCount > 0) {
        hasInitializedFromHistoryRef.current = true;
      }
      previousMessageCountRef.current = currentCount;
      return;
    }

    if (currentCount > previousMessageCountRef.current) {
      const lastMessage = displayMessages[currentCount - 1];
      if (lastMessage && !lastMessage.fromUser) {
        setAnimatedAssistantMessageId(lastMessage.id);
      }
    }

    previousMessageCountRef.current = currentCount;
  }, [displayMessages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessageText = input.trim();
    setInput("");

    // ChatGPT-style behavior: Create session ID on first message
    let activeSessionId = sessionId;
    let isNewConversation = false;
    
    if (!activeSessionId) {
      // First message in new conversation - generate session ID now
      activeSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      isNewConversation = true;
    }

    // Send message with the session ID (new or existing)
    const response = await sendMessage(userMessageText, activeSessionId);

    // Update URL only after successful send for new conversations
    if (isNewConversation && response?.success) {
      router.replace(`/chat?session=${activeSessionId}`, { scroll: false });
    }

    // Refresh sidebar list after successful sends
    if (response?.success) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("conversationCreated"));
      }, 500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading) handleSend();
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleRetryLast = async () => {
    if (!loading) {
      await retryLastMessage();
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    setInput(prompt);
    setFocusInputSignal((prev) => prev + 1);
  };

  const toggleExpandedMessage = (id: number) => {
    const next = new Set(expandedMessages);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedMessages(next);
  };

  // Parse response: show Direct Answer by default, hide sources/legal details behind button
  const parseResponse = (
    text: string
  ): { visiblePart: string; fullContent: string; hasMore: boolean; isAlbanian: boolean; refId: string | null } => {
    // Extract ref ID (appended by our API client) and strip it from content
    const refMatch = text.match(/\n\nref: ([a-f0-9]{8})\s*$/i);
    const refId = refMatch ? refMatch[1] : null;
    const cleanText = refMatch ? text.substring(0, refMatch.index!).trim() : text;
    
    // Try Albanian section headings first
    // const albanianPattern = /\n\s*\*{0,2}\s*(?:Burimi i Konceptit|Lloji i Burimit|Bazë Ligjore|Burimi Ligjor)\s*\*{0,2}\s*\n/i;
    const albanianPattern =
      /^\s*\*{0,2}\s*(?:Burimi i Konceptit|Lloji i Burimit|Bazë Ligjore|Burimi Ligjor)\s*\*{0,2}\s*/im;
    const albanianMatch = cleanText.match(albanianPattern);
    
    if (albanianMatch && albanianMatch.index !== undefined) {
      const visiblePart = cleanText.substring(0, albanianMatch.index).trim();
      const hiddenPart = cleanText.substring(albanianMatch.index).trim();
      return {
        visiblePart,
        fullContent: cleanText,
        hasMore: hiddenPart.length > 20,
        isAlbanian: true,
        refId,
      };
    }
    
    // Try English section headings
    const englishPattern = /\n\s*\*{0,2}\s*(?:Source Type|Legal Basis)\s*\*{0,2}\s*\n/i;
    const englishMatch = cleanText.match(englishPattern);
    
    if (englishMatch && englishMatch.index !== undefined) {
      const visiblePart = cleanText.substring(0, englishMatch.index).trim();
      const hiddenPart = cleanText.substring(englishMatch.index).trim();
      return {
        visiblePart,
        fullContent: cleanText,
        hasMore: hiddenPart.length > 20,
        isAlbanian: false,
        refId,
      };
    }
    
    // No metadata section found - show everything, no button
    return {
      visiblePart: cleanText,
      fullContent: cleanText,
      hasMore: false,
      isAlbanian: false,
      refId,
    };
  };

  return (
    <Box sx={{ display: "flex" }}>
      {!isMobile && (
        <Sidebar
          items={navigationItems}
          selectedItem="chat"
          user={{
            name: authUser?.full_name || authUser?.email || "User",
            email: authUser?.email || "user@deputeti.ai",
          }}
        />
      )}

      {isMobile && (
        <Drawer
          anchor="left"
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          sx={{
            "& .MuiDrawer-paper": {
              width: 270,
            },
          }}
        >
          <Sidebar
            items={navigationItems}
            selectedItem="chat"
            user={{
              name: authUser?.full_name || authUser?.email || "User",
              email: authUser?.email || "user@deputeti.ai",
            }}
          />
        </Drawer>
      )}

      <Box component="main" sx={{ flexGrow: 1, minHeight: "100vh", width: isMobile ? "100%" : "auto" }}>
        <DashboardLayout
          header={
            <PageHeader breadcrumbItems={[{ label: "Asistenti Ligjor" }]} user={userForHeader} onLogout={handleLogout} />
          }
        >
          {isMobile && (
            <Box sx={{ position: "fixed", top: 16, left: 16, zIndex: 1100 }}>
              <IconButton
                onClick={() => setMobileMenuOpen(true)}
                sx={{
                  bgcolor: "hsl(var(--surface))",
                  border: "1px solid hsl(var(--border-soft))",
                  "&:hover": { bgcolor: "hsl(var(--surface-muted))" },
                }}
              >
                <MenuIcon />
              </IconButton>
            </Box>
          )}

          <Box
            sx={{
              height: { xs: "calc(100vh - 60px)", sm: "calc(100vh - 70px)", md: "calc(100vh - 80px)" },
              display: "flex",
              flexDirection: "column",
              bgcolor: "hsl(var(--app-bg))",
              borderRadius: 3,
            }}
          >
            <Box
              ref={chatContainerRef}
              aria-busy={loading}
              sx={{
                flex: 1,
                overflowY: "auto",
                px: { xs: 1.5, sm: 3 },
                py: { xs: 1.4, sm: 2.2 },
                mt: isMobile ? 6 : 0,
              }}
            >
              {displayMessages.length === 0 && <TopToolbar />}
              <Box sx={{ width: "100%", maxWidth: 780, mx: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
                {displayMessages.length === 0 ? (
                  <PromptSuggestionGrid onPromptClick={handleSuggestionClick} selectedLawLabel={selectedLawLabel} />
                ) : (
                  <>
                    {displayMessages.map((msg) => {
                    const parsed = msg.fromUser ? null : parseResponse(msg.text);
                    return (
                      <MessageBubble
                        key={msg.id}
                        id={msg.id}
                        text={msg.text}
                        isUserMessage={msg.fromUser}
                        visiblePart={parsed?.visiblePart || msg.text}
                        fullContent={parsed?.fullContent || msg.text}
                        hasMore={parsed?.hasMore || false}
                        isExpanded={expandedMessages.has(msg.id)}
                        isAlbanian={parsed?.isAlbanian || false}
                        refId={parsed?.refId || null}
                        sources={msg.sources}
                        reasoningSteps={msg.reasoningSteps}
                        animateTyping={!msg.fromUser && animatedAssistantMessageId === msg.id}
                        onToggleExpand={toggleExpandedMessage}
                      />
                    );
                  })}
                    {loading && (
                      <Box sx={{ color: "hsl(var(--text-muted))", width: "100%", maxWidth: 780 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography sx={{ fontSize: "0.9rem" }}>Po gjenerohet pergjigjja...</Typography>
                          <Box
                            component="span"
                            sx={{
                              width: 8,
                              height: 16,
                              bgcolor: "hsl(var(--primary))",
                              animation: "blinkCursor 1s steps(2, start) infinite",
                              "@keyframes blinkCursor": {
                                "0%, 50%": { opacity: 1 },
                                "50.01%, 100%": { opacity: 0 },
                              },
                            }}
                          />
                        </Box>
                        <Typography sx={{ fontSize: "0.8rem", mt: 0.35 }}>
                          Po merren burimet ligjore dhe hapat e arsyetimit...
                        </Typography>
                      </Box>
                    )}
                  </>
                )}
                <div ref={messagesEndRef} />
              </Box>
            </Box>

            {(error || lastFailedUserMessage) && (
              <Box sx={{ px: { xs: 1.5, sm: 2.5 }, pb: 0.5 }}>
                <Box
                  sx={{
                    maxWidth: 780,
                    mx: "auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                  }}
                >
                  <Typography sx={{ fontSize: "0.82rem", color: "hsl(var(--text-muted))" }}>
                    {error || "Last message failed."}
                  </Typography>
                  {lastFailedUserMessage && (
                    <Button variant="text" size="small" onClick={handleRetryLast} disabled={loading}>
                      Provo perseri
                    </Button>
                  )}
                </Box>
              </Box>
            )}

            <ComposerBar
              loading={loading}
              input={input}
              onInputChange={setInput}
              onSend={handleSend}
              onKeyDown={handleKeyDown}
              focusInputSignal={focusInputSignal}
            />
          </Box>
        </DashboardLayout>
      </Box>
    </Box>
  );
}

// Wrapper component with Suspense for useSearchParams
function ChatPageWrapper() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f5f4f1",
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}

// Export with dynamic import to prevent SSR hydration issues
const ChatPage = dynamic(
  () => Promise.resolve({ default: ChatPageWrapper }),
  {
    ssr: false,
    loading: () => (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f4f1",
        }}
      >
        <CircularProgress />
      </Box>
    ),
  },
);

export default ChatPage;

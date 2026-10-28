import axios, { AxiosInstance, AxiosError } from 'axios';
import { devError, devLog, devWarn } from '@/lib/utils/logger';
import { translate } from '@/lib/i18n';
// ALL TRANSLATION DISABLED - Backend handles everything
// No language detection, no system messages, no translation from frontend

// API Base URL - use eu-law.deputeti.ai (without #/chat which is frontend route)
// Note: #/chat is a frontend route, API endpoints are at the root domain
let API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eu-law.deputeti.ai';

// Force correct endpoint - remove any hash routes or old endpoints
if (API_BASE_URL.includes('asistenti.deputeti.ai')) {
  devWarn('[API Config] ⚠️ Detected old endpoint, forcing to eu-law.deputeti.ai');
  API_BASE_URL = 'https://eu-law.deputeti.ai';
}
// Remove hash routes if accidentally included (they're frontend routes, not API)
if (API_BASE_URL.includes('#')) {
  API_BASE_URL = API_BASE_URL.split('#')[0];
}
// Ensure no trailing slash
API_BASE_URL = API_BASE_URL.replace(/\/$/, '');
const DEFAULT_MODEL = process.env.NEXT_PUBLIC_CHAT_MODEL || 'eu-law-rag';

// Debug: Log environment on client side (only in browser)
if (typeof window !== 'undefined') {
  // Warn if old endpoint is detected
  if (API_BASE_URL.includes('asistenti.deputeti.ai')) {
    devError('[API Config] ⚠️ WARNING: Using old endpoint! Please set NEXT_PUBLIC_API_URL=https://eu-law.deputeti.ai');
  }

  devLog('[API Config] Environment check:', {
    API_BASE_URL,
    DEFAULT_MODEL,
    env_API_URL: process.env.NEXT_PUBLIC_API_URL,
    env_MODEL: process.env.NEXT_PUBLIC_CHAT_MODEL,
    isProduction: process.env.NODE_ENV === 'production',
    usingDefault: !process.env.NEXT_PUBLIC_API_URL,
  });
}

/**
 * API Client for Deputeti AI
 * 
 * Uses conversation-based API with JWT Bearer token authentication
 * Endpoint: /api/v1/conversations/{id}/messages
 */
class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 120000, // 2 minutes timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - logging only (app session cookie authenticates BFF routes)
    this.client.interceptors.request.use(
      async (config) => {
        const fullUrl = `${config.baseURL}${config.url}`;
        devLog(`[API Client] 📤 ${config.method?.toUpperCase()} ${fullUrl}`);

        const requestDataForLog = config.data;
        const requestDataJson = typeof requestDataForLog === 'string'
          ? requestDataForLog
          : JSON.stringify(requestDataForLog);

        devLog('[API Client] Request config:', {
          fullUrl: fullUrl,
          baseURL: config.baseURL,
          url: config.url,
          method: config.method,
          dataType: typeof config.data,
          dataAsJson: requestDataJson,
        });

        return config;
      },
      (error) => {
        devError('[API Client] ❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => {
        devLog(`[API Client] ✅ ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);

        return response;
      },
      async (error: AxiosError) => {
        const status = error.response?.status || error.code || 'Network Error';
        const method = error.config?.method?.toUpperCase();
        const url = error.config?.url;
        const fullUrl = error.config?.baseURL ? `${error.config.baseURL}${url}` : url;

        devError(`[API Client] ❌ ${status} ${method} ${fullUrl}`);

        const responseData = error.response?.data;
        const responseDataStr = responseData
          ? (typeof responseData === 'string' ? responseData : JSON.stringify(responseData, null, 2))
          : 'No response data';

        devError('[API Client] Error details:', {
          errorCode: error.code,
          errorMessage: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          fullUrl: fullUrl,
          baseURL: error.config?.baseURL,
          url: url,
          method: method,
          responseData: responseDataStr,
          requestData: error.config?.data ? (typeof error.config.data === 'string' ? error.config.data : JSON.stringify(error.config.data, null, 2)) : 'No request data',
        });

        if (error.response?.status === 500) {
          devError('[API Client] 500 Server Error - Full response:', JSON.stringify(error.response?.data, null, 2));
        }

        if (error.response?.status === 401 && typeof window !== 'undefined') {
          devWarn('[API Client] ⚠️ 401 Unauthorized - session may have expired');
          window.location.href = '/login';
        }

        if (error.code === 'ECONNABORTED') {
          devError('[API Client] ⚠️ Request timeout - server may be processing');
        } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
          devError('[API Client] ⚠️ Network error - Possible causes:');
          devError('  1. CORS issue - server may not allow requests from this origin');
          devError('  2. Server is down or unreachable');
          devError('  3. SSL/certificate issue');
          devError('  4. Endpoint does not exist:', fullUrl);
          devError('  5. Check browser console Network tab for more details');
        } else if (error.code === 'ERR_CERT_AUTHORITY_INVALID' || error.code === 'ERR_SSL_PROTOCOL_ERROR') {
          devError('[API Client] ⚠️ SSL/Certificate error - server certificate may be invalid');
        }

        return Promise.reject(error);
      }
    );
  }

  // Public methods
  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    // If data is a string (pre-stringified JSON), ensure it's sent correctly
    const mergedConfig = config ? {
      ...config,
      headers: {
        ...this.client.defaults.headers,
        ...config.headers,
      }
    } : undefined;

    const response = await this.client.post<T>(url, data, mergedConfig);
    return response.data;
  }
}

export const apiClient = new APIClient();

// ==================== Chat API Client (OpenAI-compatible) ====================

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  sources?: ChatSource[];
  reasoningSteps?: string[];
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
}

export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finish_reason: string;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  sources?: unknown;
  metadata?: unknown;
}

export interface ChatSource {
  label: string;
  title?: string;
  reference?: string;
  treaty?: string;
  article?: string;
  documentId?: string;
  articleHeading?: string;
  textPreview?: string;
  sourceType?: string;
  score?: number;
  dataSource?: "eu_law" | "albanian";
}

// Simplified response for our chat interface
export interface ChatResponse {
  success: boolean;
  response: string;
  error?: string;
  sources?: ChatSource[];
  reasoningSteps?: string[];
}

interface SessionMessages {
  session_id: string;
  conversation_id?: string;
  messages: ChatMessage[];
  last_updated: string;
}

type ConversationListItem = {
  session_id: string;
  preview: string;
  last_updated: string;
  message_count: number;
};

// Conversation API response format
interface ConversationMessageResponse {
  user_message: {
    id: string;
    role: string;
    content: string;
    created_at: string;
  };
  assistant_message: {
    id: string;
    role: string;
    content: string;
    sources?: any[];
    created_at: string;
  };
  tracking_id?: number;
}

interface Conversation {
  id: string;
  title: string;
  profile: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  message_count: number;
  scope: string;
}

class ChatAPIClient {
  private apiClient: APIClient;

  constructor(apiClient: APIClient) {
    this.apiClient = apiClient;
  }

  private extractSources(rawSources: unknown, content: string): ChatSource[] {
    if (Array.isArray(rawSources)) {
      const mappedSources: Array<ChatSource | null> = rawSources
        .map((item) => {
          if (typeof item === "string") {
            const text = item.trim();
            return text ? { label: text } : null;
          }
          if (item && typeof item === "object") {
            const record = item as Record<string, unknown>;
            const rawLabel = record.label || record.title || record.reference || record.source || record.id;
            const fallbackLabel = (() => {
              const srcType = typeof record.source_type === "string" ? record.source_type.trim() : "";
              const treaty = typeof record.treaty === "string" ? record.treaty.trim() : "";
              const article = typeof record.article === "string" ? record.article.trim() : "";
              const docId =
                typeof record.document_id === "string"
                  ? record.document_id.trim()
                  : typeof record.document_id === "number"
                    ? String(record.document_id)
                    : "";

              if (treaty && article) return `[${treaty}] ${article}`;
              if (srcType && docId) return `${srcType}:${docId}`;
              if (srcType) return srcType;
              if (docId) return docId;
              return "";
            })();

            const resolvedLabel =
              typeof rawLabel === "string" && rawLabel.trim() ? rawLabel.trim() : fallbackLabel;

            if (resolvedLabel) {
              return {
                label: resolvedLabel,
                title: typeof record.title === "string" ? record.title : undefined,
                reference: typeof record.reference === "string" ? record.reference : undefined,
                treaty: typeof record.treaty === "string" ? record.treaty : undefined,
                article: typeof record.article === "string" ? record.article : undefined,
                documentId:
                  typeof record.document_id === "string"
                    ? record.document_id
                    : typeof record.document_id === "number"
                      ? String(record.document_id)
                      : undefined,
                articleHeading: typeof record.article_heading === "string" ? record.article_heading : undefined,
                textPreview: typeof record.text_preview === "string" ? record.text_preview : undefined,
                sourceType: typeof record.source_type === "string" ? record.source_type : undefined,
                score: typeof record.score === "number" ? record.score : undefined,
                dataSource: record.data_source === "albanian" ? "albanian" : record.data_source === "eu_law" ? "eu_law" : undefined,
              };
            }
          }
          return null;
        });

      return mappedSources.filter((item): item is ChatSource => item !== null).slice(0, 12);
    }

    const sourcesFromContent = content.match(/(?:\*\*Sources:\*\*|Sources:)\s*([^\n]+)/i);
    if (sourcesFromContent?.[1]) {
      return sourcesFromContent[1]
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((label) => ({ label }))
        .slice(0, 12);
    }

    return [];
  }

  private extractReasoningSteps(rawMetadata: unknown, content: string, sourcesCount: number): string[] {
    if (rawMetadata && typeof rawMetadata === "object") {
      const metadata = rawMetadata as Record<string, unknown>;
      const candidates = ["thinking_steps", "reasoning_steps", "steps", "thoughts"];

      for (const key of candidates) {
        const value = metadata[key];
        if (Array.isArray(value)) {
          const steps = value
            .map((step) => {
              if (typeof step === "string") return step.trim();
              if (step && typeof step === "object") {
                const record = step as Record<string, unknown>;
                const txt = record.text || record.content || record.summary || record.title;
                return typeof txt === "string" ? txt.trim() : "";
              }
              return "";
            })
            .filter(Boolean)
            .slice(0, 8);
          if (steps.length > 0) return steps;
        }
      }
    }

    const fallbackSteps: string[] = [];
    fallbackSteps.push(translate('stepClassify'));
    fallbackSteps.push(translate('stepSearch'));
    if (sourcesCount > 0) {
      fallbackSteps.push(translate('stepEvaluate', { count: sourcesCount }));
    }
    if (/retrieval:/i.test(content)) {
      fallbackSteps.push(translate('stepRetrieval'));
    }
    fallbackSteps.push(translate('stepSynthesis'));
    return fallbackSteps;
  }

  /**
   * Get or create a conversation
   */
  async getOrCreateConversation(conversationId?: string): Promise<string> {
    if (conversationId && conversationId.includes('-') && conversationId.length > 30) {
      // Verify conversation exists (only if it looks like a UUID)
      try {
        const conversation = await this.apiClient.get<Conversation>(`/api/v1/conversations/${conversationId}`);
        if (conversation && conversation.id) {
          return conversation.id;
        }
      } catch (error) {
        devWarn('[ChatAPI] Conversation not found, creating new one:', error);
      }
    }

    // Create new conversation
    try {
      const response = await this.apiClient.post<Conversation>('/api/v1/conversations', {
        title: translate('newChat'),
        profile: 'general',
      });
      devLog('[ChatAPI] Created new conversation:', response.id);
      return response.id;
    } catch (error: any) {
      devError('[ChatAPI] Failed to create conversation:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to create conversation';
      throw new Error(errorMessage);
    }
  }

  async sendMessage(
    userMessage: string,
    sessionId: string = "default",
    conversationHistory: ChatMessage[] = []
  ): Promise<ChatResponse> {
    try {
      // Send ONLY the user message to the backend
      // No system message, no conversation history - backend handles everything
      // This ensures we get the same response as the backend webapp
      const messages: ChatMessage[] = [
        { role: "user", content: userMessage },
      ];

      // Send an abstracted payload to the local proxy. The proxy builds the
      // backend OpenAI-compatible shape server-side.
      const selectedLaw = typeof window !== 'undefined' ? localStorage.getItem('selected_law') : null;
      const source: "eu_law" | "albanian" = selectedLaw === 'albanian' ? 'albanian' : 'eu_law';
      const existingConversationId = await this.getUpstreamConversationId(sessionId);

      const requestBody: {
        prompt: string;
        source: "eu_law" | "albanian";
        conversation_id?: string;
        session_id: string;
      } = {
        prompt: userMessage,
        source,
        session_id: sessionId,
      };
      if (existingConversationId) {
        requestBody.conversation_id = existingConversationId;
      }

      // Log what we're actually sending
      const requestBodyJson = JSON.stringify(requestBody);
      devLog('[ChatAPI] 📤 Sending request to local proxy:', '/api/chat');
      devLog('[ChatAPI] User message:', userMessage.substring(0, 80));
      devLog('[ChatAPI] Request body (JSON):', requestBodyJson);
      devLog('[ChatAPI] Request details:', {
        messageCount: messages.length,
        messagePreview: userMessage.substring(0, 80),
        source,
      });

      const proxyResponse = await axios.post<ChatCompletionResponse>('/api/chat', requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
        timeout: 120000,
      });
      const response = proxyResponse.data;
      const responseMetadata = response.metadata && typeof response.metadata === "object"
        ? (response.metadata as Record<string, unknown>)
        : null;
      const responseConversationId =
        typeof responseMetadata?.conversation_id === "string" ? responseMetadata.conversation_id : existingConversationId;
      const responseSourceSummary = Array.isArray(response.sources)
        ? response.sources.slice(0, 8).map((item) => {
          if (item && typeof item === "object") {
            const sourceRecord = item as Record<string, unknown>;
            return String(
              sourceRecord.source ||
              sourceRecord.data_source ||
              sourceRecord.source_type ||
              sourceRecord.treaty ||
              sourceRecord.id ||
              "unknown"
            );
          }
          return typeof item === "string" ? item : "unknown";
        })
        : [];

      // Extract stable short reference ID from response for backend tracking
      const rawId = response.id || '';
      const normalizedId = rawId.replace(/^chatcmpl-/, '');
      const tailRefMatch = normalizedId.match(/([a-z0-9]{8,})$/i);
      const refId = tailRefMatch
        ? tailRefMatch[1].slice(0, 8)
        : normalizedId.slice(0, 8) || '';

      devLog('[ChatAPI] Response received:', {
        status: 'success',
        rawId,
        refId,
        selectedLaw,
        requestSource: source,
        responseSourceSummary,
        fullResponse: response,
      });

      // Extract assistant message from response - return EXACTLY as received from backend
      const assistantMessage = response.choices?.[0]?.message?.content || '';

      if (!assistantMessage) {
        devError('[ChatAPI] No assistant message in response:', response);
        return {
          success: false,
          response: '',
          error: 'No response from assistant',
        };
      }

      // Append reference ID to content so it persists with the conversation
      const finalResponse = refId
        ? `${assistantMessage}\n\nref: ${refId}`
        : assistantMessage;
      const sources = this.extractSources(response.sources, assistantMessage);
      const reasoningSteps = this.extractReasoningSteps(response.metadata, assistantMessage, sources.length);
      devLog('[ChatAPI] Response with ref:', refId, finalResponse.substring(0, 80));

      // Server /api/chat already persists the turn. Refresh list for sidebar.
      // Also sync sources/reasoning/ref into DB for richer client reloads.
      const updatedMessages: ChatMessage[] = [
        ...conversationHistory,
        { role: "user", content: userMessage },
        { role: "assistant", content: finalResponse, sources, reasoningSteps },
      ];
      await this.saveSessionMessages(sessionId, updatedMessages, responseConversationId || undefined);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sessionUpdated', { detail: { sessionId } }));
      }

      return {
        success: true,
        response: finalResponse,
        sources,
        reasoningSteps,
      };
    } catch (error: any) {
      // Better error logging
      const errorData = error.response?.data;
      const errorStatus = error.response?.status;
      const errorStatusText = error.response?.statusText;
      const errorCode = error.code;
      const errorMessage = error.message;
      const fullUrl = error.config?.baseURL ? `${error.config.baseURL}${error.config.url}` : error.config?.url;

      // Extract error message properly
      const errorDataStr = errorData
        ? (typeof errorData === 'string' ? errorData : JSON.stringify(errorData, null, 2))
        : 'No error data';

      const requestDataStr = error.config?.data
        ? (typeof error.config.data === 'string' ? error.config.data : JSON.stringify(error.config.data, null, 2))
        : 'No request data';

      // Comprehensive error logging
      devError('[ChatAPI] ❌ Error sending message:', {
        errorCode: errorCode,
        errorMessage: errorMessage,
        status: errorStatus,
        statusText: errorStatusText,
        fullUrl: fullUrl,
        baseURL: error.config?.baseURL,
        requestUrl: error.config?.url,
        requestMethod: error.config?.method,
        errorResponseData: errorDataStr,
        requestData: requestDataStr,
        hasResponse: !!error.response,
        isNetworkError: errorCode === 'ERR_NETWORK' || errorMessage?.includes('Network Error'),
        isTimeout: errorCode === 'ECONNABORTED',
        isCORS: errorMessage?.includes('CORS') || errorMessage?.includes('Access-Control'),
      });

      // Special handling for network errors
      if (errorCode === 'ERR_NETWORK' || errorMessage?.includes('Network Error')) {
        devError('[ChatAPI] 🔍 Network Error Diagnosis:');
        devError('  1. Check if endpoint exists:', fullUrl);
        devError('  2. Check browser Network tab for CORS errors');
        devError('  3. Verify server is reachable');
        devError('  4. Check if SSL certificate is valid');
        devError('  5. Try opening the URL directly in browser:', fullUrl);
      }

      // Build a production-safe user message (avoid leaking endpoint URLs/internal details)
      let userErrorMessage = translate('errGeneric');

      if (errorCode === 'ERR_NETWORK' || errorMessage?.includes('Network Error')) {
        userErrorMessage = translate('errNetwork');
      } else if (errorCode === 'ECONNABORTED') {
        userErrorMessage = translate('errTimeout');
      } else if (errorStatus === 401 || errorStatus === 403) {
        userErrorMessage = translate('errAuth');
      } else if (errorStatus === 429) {
        userErrorMessage = translate('errRateLimit');
      } else if (typeof errorStatus === 'number' && errorStatus >= 500) {
        userErrorMessage = translate('errUnavailable');
      } else if (typeof errorStatus === 'number' && errorStatus >= 400) {
        userErrorMessage = translate('errBadRequest');
      }

      // If we got a 500 error with RAG pipeline error, show it clearly
      if (errorStatus === 500 && userErrorMessage.includes('RAG')) {
        devError('[ChatAPI] ⚠️ RAG Pipeline Error detected!');
        devError('[ChatAPI] This suggests the backend received data in an unexpected format.');
        devError('[ChatAPI] Error response:', errorDataStr);
        devError('[ChatAPI] What we sent:', requestDataStr);
        devError('[ChatAPI] Expected format (from working website):', JSON.stringify({
          content: "What is Article 50 TEU?"
        }, null, 2));
      }

      // Return error message as-is
      const translatedErrorMessage = userErrorMessage;

      return {
        success: false,
        response: '',
        error: translatedErrorMessage,
      };
    }
  }

  async getUpstreamConversationId(sessionId: string): Promise<string | null> {
    if (typeof window === "undefined") return null;
    try {
      const response = await fetch(`/api/conversations/${encodeURIComponent(sessionId)}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) return null;
      const data = (await response.json()) as {
        conversation?: { upstream_conversation_id?: string | null };
      };
      return data.conversation?.upstream_conversation_id || null;
    } catch (error) {
      devError("[ChatAPI] Error loading upstream conversation id:", error);
      return null;
    }
  }

  /**
   * Get conversation history for the signed-in user from the DB.
   */
  async getConversationHistory(sessionId: string): Promise<ChatMessage[]> {
    if (typeof window === "undefined") return [];

    try {
      const response = await fetch(`/api/conversations/${encodeURIComponent(sessionId)}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      if (response.status === 404) return [];
      if (!response.ok) {
        throw new Error(`Failed to load conversation (${response.status})`);
      }

      const data = (await response.json()) as {
        conversation?: SessionMessages & {
          messages?: ChatMessage[];
          upstream_conversation_id?: string | null;
        };
      };
      const messages = data.conversation?.messages || [];

      return messages
        .map((msg) => {
          const role = msg.role as "user" | "assistant" | "system";
          const content = String(msg.content || "");
          const sources = Array.isArray(msg.sources) ? msg.sources : undefined;
          const reasoningSteps = Array.isArray(msg.reasoningSteps)
            ? msg.reasoningSteps.map((step) => String(step))
            : undefined;

          return {
            role,
            content,
            ...(sources ? { sources } : {}),
            ...(reasoningSteps ? { reasoningSteps } : {}),
          } as ChatMessage;
        })
        .filter((msg) => msg.role && msg.content);
    } catch (error) {
      devError("[ChatAPI] Error loading conversation history:", error);
      return [];
    }
  }

  /**
   * Save conversation messages for the signed-in user.
   */
  async saveSessionMessages(
    sessionId: string,
    messages: ChatMessage[],
    conversationId?: string | null
  ): Promise<void> {
    if (typeof window === "undefined") return;

    try {
      const response = await fetch(`/api/conversations/${encodeURIComponent(sessionId)}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          upstream_conversation_id: conversationId ?? undefined,
        }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Failed to save conversation (${response.status})`);
      }
    } catch (error) {
      devError("[ChatAPI] Error saving session messages:", error);
    }
  }

  /**
   * Get list of conversation sessions for the signed-in user.
   */
  async getConversationSessions(): Promise<ConversationListItem[]> {
    if (typeof window === "undefined") return [];

    try {
      const response = await fetch("/api/conversations", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`Failed to load conversations (${response.status})`);
      }
      const data = (await response.json()) as { conversations?: ConversationListItem[] };
      const sessions = data.conversations || [];
      return sessions.sort(
        (a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
      );
    } catch (error) {
      devError("[ChatAPI] Error loading sessions list:", error);
      return [];
    }
  }

  /**
   * Delete a conversation session for the signed-in user.
   */
  async deleteConversation(sessionId: string): Promise<void> {
    if (typeof window === "undefined") return;

    try {
      const response = await fetch(`/api/conversations/${encodeURIComponent(sessionId)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok && response.status !== 404) {
        throw new Error(`Failed to delete conversation (${response.status})`);
      }
    } catch (error) {
      devError("[ChatAPI] Error deleting session:", error);
    }
  }
}

export const chatClient = new ChatAPIClient(apiClient);
// Legacy export name for compatibility
export const agentClient = chatClient;

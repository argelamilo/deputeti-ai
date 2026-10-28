// Query types for the chatbot/queries feature
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface Query {
  id: string;
  title: string;
  description?: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  tenantId: string;
}

export interface QueryListItem {
  id: string;
  title: string;
  preview?: string;
  updatedAt: string;
}


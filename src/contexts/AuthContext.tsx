"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthContextType, LoginData, RegisterData, User } from "@/types/auth";
import { devError } from "@/lib/utils/logger";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function parseErrorDetail(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { detail?: unknown };
    if (typeof data.detail === "string" && data.detail.trim()) {
      return data.detail;
    }
  } catch {
    // ignore parse errors
  }
  return "Request failed.";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        setUser(null);
        return;
      }

      const data = (await response.json()) as { user?: User };
      setUser(data.user ?? null);
    } catch (err) {
      devError("[AuthContext] Failed to load session:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const login = useCallback(async (data: LoginData): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const detail = await parseErrorDetail(response);
        setError(detail);
        setUser(null);
        return { success: false, error: detail };
      }

      const payload = (await response.json()) as { user?: User };
      if (!payload.user) {
        const detail = "Login succeeded but user payload was missing.";
        setError(detail);
        return { success: false, error: detail };
      }

      setUser(payload.user);
      return { success: true };
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Login failed.";
      setError(detail);
      return { success: false, error: detail };
    }
  }, []);

  const register = useCallback(
    async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
      setError(null);
      try {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: data.email,
            password: data.password,
            full_name: data.full_name,
          }),
        });

        if (!response.ok) {
          const detail = await parseErrorDetail(response);
          setError(detail);
          setUser(null);
          return { success: false, error: detail };
        }

        const payload = (await response.json()) as { user?: User };
        if (!payload.user) {
          const detail = "Signup succeeded but user payload was missing.";
          setError(detail);
          return { success: false, error: detail };
        }

        setUser(payload.user);
        return { success: true };
      } catch (err) {
        const detail = err instanceof Error ? err.message : "Signup failed.";
        setError(detail);
        return { success: false, error: detail };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      devError("[AuthContext] Logout request failed:", err);
    }

    if (typeof window !== "undefined") {
      // Clear legacy shared localStorage chat keys (pre-DB persistence).
      try {
        const sessionsJson = localStorage.getItem("chat_sessions_list");
        if (sessionsJson) {
          const sessions = JSON.parse(sessionsJson) as Array<{ session_id?: string }>;
          sessions.forEach((session) => {
            if (typeof session.session_id === "string" && session.session_id.trim()) {
              localStorage.removeItem(`chat_session_${session.session_id}`);
            }
          });
        }
      } catch (err) {
        devError("[AuthContext] Error clearing legacy chat sessions:", err);
      }
      localStorage.removeItem("chat_sessions_list");
      localStorage.removeItem("jwt_token");
      localStorage.removeItem("jwt_token_refreshed_at");
    }

    setUser(null);
    setError(null);
    router.push("/login");
  }, [router]);

  const value: AuthContextType = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

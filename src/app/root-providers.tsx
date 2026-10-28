"use client";

/**
 * Root Providers
 *
 * Minimal providers needed for ALL pages (including login)
 * - QueryClientProvider: Required for React Query
 * - AuthProvider: Required for login page and authentication
 *
 * Dashboard-specific providers (TenantProvider) are in (dashboard)/providers.tsx
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { AuthProvider } from "@/contexts/AuthContext";

const appTheme = createTheme({
  typography: {
    fontFamily: "var(--font-space-grotesk), var(--font-geist-sans), sans-serif",
    h6: {
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
    body2: {
      color: "hsl(var(--text-muted))",
    },
  },
  shape: {
    borderRadius: 12,
  },
  palette: {
    background: {
      default: "hsl(var(--app-bg))",
      paper: "hsl(var(--surface))",
    },
    primary: {
      main: "hsl(var(--primary))",
      contrastText: "hsl(var(--primary-foreground))",
    },
    text: {
      primary: "hsl(var(--text-primary))",
      secondary: "hsl(var(--text-muted))",
    },
    divider: "hsl(var(--border-soft))",
  },
  transitions: {
    duration: {
      shortest: 120,
      shorter: 160,
      short: 200,
      standard: 250,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "hsl(var(--app-bg))",
          color: "hsl(var(--text-primary))",
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: "1px solid hsl(var(--border-soft))",
          backgroundImage: "none",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: "1px solid hsl(var(--border-soft))",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiInputBase-root": {
            borderRadius: 18,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 10,
          fontWeight: 500,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
  },
});

export function RootProviders({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes (matches backend cache)
            gcTime: 10 * 60 * 1000, // 10 minutes
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={appTheme}>
        <CssBaseline />
        <AuthProvider>{mounted ? children : null}</AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

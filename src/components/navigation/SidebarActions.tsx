"use client";

import {
  Button,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import SearchIcon from "@mui/icons-material/Search";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useConversationSessions } from "@/hooks/useConversationSessions";
import { SidebarSectionHeader } from "./SidebarSectionHeader";

interface SidebarActionsProps {
  actions?: Array<{ id: string; label: string; onClick?: () => void }>;
}

export function SidebarActions({ actions }: SidebarActionsProps) {
  const router = useRouter();
  const { sessions, deleteSession } = useConversationSessions();
  const [openSections, setOpenSections] = useState({
    projects: true,
    bookmarks: true,
    alerts: true,
    saved: true,
    history: true,
  });

  // Handle new query - go to chat page with no session ID (fresh start)
  const handleNewQuery = () => {
    router.push("/chat");
  };

  // Handle session click - go to chat page with session ID to load conversation
  const handleSessionClick = (sessionId: string) => {
    router.push(`/chat?session=${sessionId}`);
  };

  // Handle delete session
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await deleteSession(sessionId);
    if (success) {
      // Session removed from state automatically by the hook
      // If we're currently viewing this session, redirect to a fresh chat
      const currentUrl = window.location.href;
      if (currentUrl.includes(`session=${sessionId}`)) {
        router.push("/chat");
      }
    }
  };

  // If custom actions are provided, use them
  if (actions && actions.length > 0) {
    return (
      <Box sx={{ display: "grid", gridTemplateColumns: "auto", px: 2 }}>
        <List dense sx={{ mb: 0, pl: 0 }}>
          {actions.map((action) => (
            <ListItem key={action.id} disablePadding>
              <ListItemButton
                onClick={action.onClick}
                sx={{
                  px: 1,
                  borderRadius: 1.5,
                  minHeight: 36,
                  fontFamily: "'Space Grotesk', sans-serif",
                  "&:hover": {
                    backgroundColor: "#f9f8f6",
                  },
                }}
              >
                <ListItemText
                  primary={action.label}
                  slotProps={{
                    primary: {
                      sx: {
                        fontSize: "14px",
                        fontWeight: 400,
                        color: "#111827",
                        fontFamily: "'Space Grotesk', sans-serif",
                      },
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    );
  }

  const historyItems = sessions;

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Default: Screenshot-inspired shell structure
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, px: 0, pb: 2 }}>
      <Box sx={{ px: 2.5 }}>
        <Box
          onClick={handleNewQuery}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleNewQuery();
            }
          }}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1,
            py: 1.25,
            borderRadius: 1,
            cursor: "pointer",
            fontSize: "0.88rem",
            fontWeight: 600,
            color: "hsl(var(--text-primary))",
            transition: "all 160ms ease",
            "&:hover": {
              backgroundColor: "hsl(var(--surface-muted))",
            },
            "&:focus-visible": {
              outline: "2px solid hsl(var(--ring))",
              outlineOffset: "2px",
            },
          }}
        >
          <AddIcon sx={{ fontSize: 18 }} />
          Bej nje pyetje te re
        </Box>
      </Box>

      {/* Temporarily disabled: PROJEKTET
      <Box sx={{ px: 2.5 }}>
        <Box
          onClick={() => toggleSection("projects")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleSection("projects");
            }
          }}
          sx={{ display: "flex", alignItems: "center", cursor: "pointer", py: 0.25 }}
        >
          <SidebarSectionHeader title="Projektet" />
          <KeyboardArrowDownIcon
            sx={{
              ml: "auto",
              mr: 0.6,
              color: "hsl(var(--text-muted))",
              fontSize: 18,
              transform: openSections.projects ? "rotate(0deg)" : "rotate(-90deg)",
              transition: "transform 160ms ease",
            }}
          />
        </Box>
        {openSections.projects && (
          <Typography sx={{ fontSize: "0.82rem", color: "hsl(var(--text-muted))", px: 1.4, pt: 0.2 }}>
            Ende nuk ka projekte
          </Typography>
        )}
      </Box>
      */}

      {/* Temporarily disabled: FAQERUAJTES, SINJALIZIME LIGJORE, KERKIME TE RUAJTURA
      <Box sx={{ px: 2.5 }}>
        <Box
          onClick={() => toggleSection("bookmarks")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleSection("bookmarks");
            }
          }}
          sx={{ display: "flex", alignItems: "center", cursor: "pointer", py: 0.25 }}
        >
          <SidebarSectionHeader title="Faqeruajtes" />
          <KeyboardArrowDownIcon
            sx={{
              ml: "auto",
              mr: 0.6,
              color: "hsl(var(--text-muted))",
              fontSize: 18,
              transform: openSections.bookmarks ? "rotate(0deg)" : "rotate(-90deg)",
              transition: "transform 160ms ease",
            }}
          />
        </Box>
      </Box>

      <Box sx={{ px: 2.5 }}>
        <Box
          onClick={() => toggleSection("alerts")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleSection("alerts");
            }
          }}
          sx={{ display: "flex", alignItems: "center", cursor: "pointer", py: 0.25 }}
        >
          <SidebarSectionHeader title="Sinjalizime Ligjore" />
          <KeyboardArrowDownIcon
            sx={{
              ml: "auto",
              mr: 0.6,
              color: "hsl(var(--text-muted))",
              fontSize: 18,
              transform: openSections.alerts ? "rotate(0deg)" : "rotate(-90deg)",
              transition: "transform 160ms ease",
            }}
          />
        </Box>
        {openSections.alerts && (
          <Button
            fullWidth
            variant="outlined"
            startIcon={<AddIcon />}
            sx={{ justifyContent: "center", color: "hsl(var(--text-muted))", mt: 0.2 }}
          >
            Sinjalizim i ri
          </Button>
        )}
      </Box>

      <Box sx={{ px: 2.5 }}>
        <Box
          onClick={() => toggleSection("saved")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleSection("saved");
            }
          }}
          sx={{ display: "flex", alignItems: "center", cursor: "pointer", py: 0.25 }}
        >
          <SidebarSectionHeader title="Kerkime te Ruajtura" />
          <KeyboardArrowDownIcon
            sx={{
              ml: "auto",
              mr: 0.6,
              color: "hsl(var(--text-muted))",
              fontSize: 18,
              transform: openSections.saved ? "rotate(0deg)" : "rotate(-90deg)",
              transition: "transform 160ms ease",
            }}
          />
        </Box>
        {openSections.saved && (
          <Button
            fullWidth
            variant="outlined"
            startIcon={<AddIcon />}
            sx={{ justifyContent: "center", color: "hsl(var(--text-muted))", mt: 0.2 }}
          >
            Ruaj kerkimin
          </Button>
        )}
      </Box>
      */}

      {/* Temporarily disabled: sidebar search bar
      <Box sx={{ px: 2.5, pt: 0.5 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Kerko..."
          slotProps={{
            input: {
              startAdornment: <SearchIcon sx={{ fontSize: 16, color: "hsl(var(--text-muted))", mr: 0.75 }} />,
            },
          }}
          sx={{
            "& .MuiInputBase-root": {
              height: 36,
              bgcolor: "hsl(var(--surface))",
            },
            "& .MuiInputBase-input": {
              fontSize: "0.86rem",
            },
          }}
        />
      </Box>
      */}

      <Box sx={{ display: "flex", alignItems: "center", px: 2.5, pt: 0.8, pb: 0.4 }}>
        <Box
          onClick={() => toggleSection("history")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleSection("history");
            }
          }}
          sx={{ display: "flex", alignItems: "center", width: "100%", cursor: "pointer", py: 0.25 }}
        >
          <SidebarSectionHeader title="Historiku" />
          <KeyboardArrowDownIcon
            sx={{
              ml: "auto",
              mr: 0.6,
              color: "hsl(var(--text-muted))",
              fontSize: 18,
              transform: openSections.history ? "rotate(0deg)" : "rotate(-90deg)",
              transition: "transform 160ms ease",
            }}
          />
        </Box>
      </Box>

      <Box sx={{ px: 2.5, mt: -0.5 }}>
        {openSections.history && historyItems.length > 0 ? (
          <List dense sx={{ mb: 0.75, pl: 0, pt: 0 }}>
            {historyItems.map((session, index) => (
              <ListItem key={`session-${session.session_id}-${index}`} disablePadding sx={{ mb: 0.35 }}>
                <Box
                  sx={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    px: 0.45,
                    py: 0.2,
                    borderRadius: 1,
                    transition: "background-color 140ms ease",
                    "&:hover": {
                      backgroundColor: "hsl(var(--surface-muted))",
                    },
                    "& .delete-btn": { opacity: 0, transition: "opacity 140ms ease" },
                    "&:hover .delete-btn": { opacity: 1 },
                  }}
                >
                  <ListItemButton
                    onClick={() => handleSessionClick(session.session_id)}
                    sx={{
                      px: 0.3,
                      py: 0.35,
                      borderRadius: 2,
                      flex: 1,
                      bgcolor: "transparent",
                      "&:hover": { bgcolor: "transparent" },
                    }}
                  >
                    <ListItemText
                      primary={session.preview || "Bisede e re"}
                      slotProps={{
                        primary: {
                          sx: {
                            fontSize: "0.86rem",
                            fontWeight: 400,
                            color: "hsl(var(--text-primary))",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          },
                        },
                      }}
                    />
                  </ListItemButton>
                  <Box
                    className="delete-btn"
                    onClick={(e) => handleDeleteSession(session.session_id, e)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 26,
                      height: 26,
                      borderRadius: 1,
                      cursor: "pointer",
                      color: "hsl(var(--text-muted))",
                      "&:hover": { color: "hsl(var(--text-primary))" },
                    }}
                    title="Fshi biseden"
                    aria-label={`Fshi biseden`}
                    role="button"
                  >
                    <DeleteOutline sx={{ fontSize: 18 }} />
                  </Box>
                </Box>
              </ListItem>
            ))}
          </List>
        ) : openSections.history ? (
          <Box sx={{ color: "hsl(var(--text-muted))", px: 1.4 }}>
            <Typography sx={{ fontSize: "0.82rem" }}>
              Ende nuk ka biseda
            </Typography>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}

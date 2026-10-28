"use client";

import { Box, IconButton } from "@mui/material";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import SearchIcon from "@mui/icons-material/Search";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useRouter } from "next/navigation";

export function TopToolbar() {
  const router = useRouter();

  const toolbarItems = [
    { id: "chat", icon: <ChatBubbleOutlineIcon sx={{ fontSize: 18 }} />, isSelected: true },
    { id: "search", icon: <SearchIcon sx={{ fontSize: 18 }} />, isSelected: false },
  ];

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mb: 1.2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        {toolbarItems.map((item) => (
          <IconButton
            key={item.id}
            size="small"
            onClick={() => {
              if (item.id === "search") {
                router.push("/explorer");
              }
            }}
            sx={{
              border: "1px solid hsl(var(--border-soft))",
              bgcolor: item.isSelected ? "hsl(var(--primary))" : "hsl(var(--surface))",
              color: item.isSelected ? "hsl(var(--primary-foreground))" : "hsl(var(--text-muted))",
              transition: "all 140ms ease",
              "&:hover": {
                color: item.isSelected ? "hsl(var(--primary-foreground))" : "hsl(var(--text-primary))",
                backgroundColor: item.isSelected ? "hsl(var(--primary))" : "hsl(var(--surface-muted))",
                transform: "translateY(-1px)",
              },
              "&:focus-visible": {
                outline: "2px solid hsl(var(--ring))",
                outlineOffset: "1px",
              },
            }}
          >
            {item.icon}
          </IconButton>
        ))}
      </Box>
    </Box>
  );
}

"use client";

// Optimized: Direct imports instead of barrel imports (saves 10-15KB)
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { NavigationItem } from "@/types/dashboard";
import { SidebarLogo } from "./SidebarLogo";
import { SidebarActions } from "./SidebarActions";

interface SidebarProps {
  items: NavigationItem[];
  selectedItem?: string;
  onItemSelect?: (itemId: string, itemPath?: string) => void;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  className?: string;
}

export function Sidebar({
  items: _items,
  selectedItem: _selectedItem,
  onItemSelect: _onItemSelect,
  user = {
    name: "User",
    email: "user@example.com",
  },
  className,
}: SidebarProps) {
  void _items;
  void _selectedItem;
  void _onItemSelect;


  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 270,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 270,
          boxSizing: "border-box",
          backgroundColor: "hsl(var(--surface))",
          boxShadow: "none",
          borderRadius: 0,
        },
      }}
      className={className}
    >
      {/* Logo Section */}
      <SidebarLogo />

      {/* Scrollable Content Section */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "hsl(var(--border-soft))",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "hsl(var(--text-muted))",
          },
        }}
      >
        {/* Sidebar sections */}
        <SidebarActions />
      </Box>

      <Box
        sx={{
          px: 2,
          py: 1.2,
          borderTop: "1px solid hsl(var(--border-soft))",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              backgroundColor: "hsl(var(--surface-muted))",
              display: "grid",
              placeItems: "center",
              fontSize: "0.74rem",
              fontWeight: 700,
              color: "hsl(var(--text-primary))",
            }}
          >
            {(user.name || "U").slice(0, 1).toUpperCase()}
          </Box>
          <Typography sx={{ fontSize: "0.86rem", maxWidth: 150 }} noWrap>
            {user.name}
          </Typography>
        </Box>
      </Box>

    </Drawer>
  );
}

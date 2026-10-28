"use client";

// Optimized: Direct imports instead of barrel imports (saves 10-15KB)
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined";
import { usePathname, useRouter } from "next/navigation";
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
  const router = useRouter();
  const pathname = usePathname();

  const footerLinks = [
    { id: "library", label: "Biblioteka", path: "/library", icon: <SearchOutlinedIcon sx={{ fontSize: 18 }} /> },
    { id: "explorer", label: "Eksploro", path: "/explorer", icon: <ExploreOutlinedIcon sx={{ fontSize: 18 }} /> },
  ];

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

      <Box sx={{ px: 2, py: 1.5, borderTop: "1px solid hsl(var(--border-soft))" }}>
        <Box sx={{ display: "grid", gap: 0.5 }}>
          {footerLinks.map((item) => (
            <Box
              key={item.id}
              component="button"
              type="button"
              onClick={() => item.path && router.push(item.path)}
              sx={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1,
                py: 0.8,
                borderRadius: 1,
                color: pathname === item.path ? "hsl(var(--text-primary))" : "hsl(var(--text-primary))",
                border: "none",
                background: pathname === item.path ? "hsl(var(--surface-muted))" : "transparent",
                textAlign: "left",
                transition: "background-color 160ms ease",
                "&:hover": { backgroundColor: "hsl(var(--surface-muted))" },
                "&:focus-visible": {
                  outline: "2px solid hsl(var(--ring))",
                  outlineOffset: "2px",
                },
              }}
            >
              {item.icon}
              <Typography sx={{ fontSize: "0.88rem" }}>{item.label}</Typography>
            </Box>
          ))}
        </Box>
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

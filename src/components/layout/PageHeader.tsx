"use client";

import { Breadcrumb } from "@/components/navigation/Breadcrumb";
import CheckIcon from "@mui/icons-material/Check";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";

interface PageHeaderProps {
  breadcrumbItems: Array<{
    label: string;
    href?: string;
  }>;
  user?: {
    id: string;
    email: string;
    company_name?: string;
    client_id?: string;
  };
  onLogout?: () => void;
}

const LAW_OPTIONS = [
  { id: "eu_law", label: "Ligji i BE-se" },
  { id: "albanian", label: "Ligji Shqiptar" },
] as const;

const LAW_STORAGE_KEY = "selected_law";

export function PageHeader({
  breadcrumbItems,
}: PageHeaderProps) {
  const [selectedLaw, setSelectedLaw] = useState<(typeof LAW_OPTIONS)[number]["id"]>("eu_law");
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const selectedLawLabel = LAW_OPTIONS.find((option) => option.id === selectedLaw)?.label || "Ligji i BE-se";

  useEffect(() => {
    const storedLaw = typeof window !== "undefined" ? window.localStorage.getItem(LAW_STORAGE_KEY) : null;
    if (storedLaw === "eu_law" || storedLaw === "albanian") {
      setSelectedLaw(storedLaw);
    }
  }, []);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        mb: 1.2,
        px: { xs: 0.5, sm: 0 },
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Breadcrumb items={breadcrumbItems} />
      </Box>

      <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center" }}>
        <Button
          onClick={(event) => setMenuAnchor(event.currentTarget)}
          endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 18 }} />}
          sx={{
            borderRadius: 1,
            px: 1.4,
            py: 0.55,
            border: "1px solid hsl(var(--border-soft))",
            bgcolor: "hsl(var(--surface))",
            color: "hsl(var(--text-primary))",
            textTransform: "none",
            fontSize: "0.9rem",
            fontWeight: 500,
          }}
        >
          {selectedLawLabel}
        </Button>
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
          PaperProps={{
            sx: {
              mt: 0.6,
              minWidth: 210,
              borderRadius: 1,
              border: "1px solid hsl(var(--border-soft))",
              bgcolor: "hsl(var(--surface))",
            },
          }}
        >
          {LAW_OPTIONS.map((option) => (
            <MenuItem
              key={option.id}
              onClick={() => {
                setSelectedLaw(option.id);
                if (typeof window !== "undefined") {
                  window.localStorage.setItem(LAW_STORAGE_KEY, option.id);
                  window.dispatchEvent(new CustomEvent("selectedLawUpdated", { detail: { value: option.id } }));
                }
                setMenuAnchor(null);
              }}
              sx={{ minHeight: 38, gap: 1 }}
            >
              {selectedLaw === option.id ? <CheckIcon sx={{ fontSize: 18 }} /> : <Box sx={{ width: 18, height: 18 }} />}
              <Typography sx={{ fontSize: "0.95rem", color: "hsl(var(--text-primary))" }}>{option.label}</Typography>
            </MenuItem>
          ))}
        </Menu>
      </Box>
    </Box>
  );
}

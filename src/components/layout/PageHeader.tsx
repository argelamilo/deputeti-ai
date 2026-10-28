"use client";

import { Breadcrumb } from "@/components/navigation/Breadcrumb";
import { UserMenu } from "@/components/navigation/UserMenu";
import Box from "@mui/material/Box";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { useLanguage } from "@/contexts/LanguageContext";
import { LANGUAGES } from "@/lib/i18n/translations";

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

export function PageHeader({
  breadcrumbItems,
  user,
  onLogout,
}: PageHeaderProps) {
  const { lang, setLang, t } = useLanguage();
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

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={lang}
          aria-label={t("language")}
          onChange={(_, next) => {
            if (next) setLang(next);
          }}
          sx={{
            "& .MuiToggleButton-root": {
              px: 1.1,
              py: 0.45,
              fontSize: "0.8rem",
              fontWeight: 600,
              textTransform: "none",
              color: "hsl(var(--text-muted))",
              border: "1px solid hsl(var(--border-soft))",
              "&.Mui-selected": {
                bgcolor: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
                "&:hover": { bgcolor: "hsl(var(--primary))" },
              },
            },
          }}
        >
          {LANGUAGES.map((option) => (
            <ToggleButton key={option.id} value={option.id} title={option.label} aria-label={option.label}>
              {option.id.toUpperCase()}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <UserMenu user={user} onLogout={onLogout} />
      </Box>
    </Box>
  );
}

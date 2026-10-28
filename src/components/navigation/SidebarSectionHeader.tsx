// Optimized: Direct import instead of barrel import
import Typography from "@mui/material/Typography";

interface SidebarSectionHeaderProps {
  title: string;
}

export function SidebarSectionHeader({ title }: SidebarSectionHeaderProps) {
  return (
    <Typography
      variant="h6"
      sx={{
        fontSize: "0.7rem",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: "hsl(var(--text-muted))",
        py: 0.5,
        lineHeight: 1.2,
      }}
    >
      {title}
    </Typography>
  );
}

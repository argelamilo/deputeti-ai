import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
} from "@mui/material";
import type { NavigationItem } from "@/types/dashboard";

interface SidebarNavListProps {
  items: NavigationItem[];
  selectedItem?: string;
  onItemClick: (item: NavigationItem) => void;
}

export function SidebarNavList({
  items,
  selectedItem,
  onItemClick,
}: SidebarNavListProps) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "auto", px: 2 }}>
      <List dense sx={{ mb: 0, pl: 0 }}>
        {items.map((item) => {
          const isSelected = selectedItem === item.id || item.active;

          return (
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                selected={isSelected}
                onClick={() => onItemClick(item)}
                sx={{
                  px: 1,
                  borderRadius: 1.5,
                  minHeight: 36,
                  fontFamily: "'Space Grotesk', sans-serif",
                  "&:hover": {
                    backgroundColor: "#f9f8f6",
                  },
                  "&.Mui-selected": {
                    backgroundColor: "#f4f3ef",
                    fontWeight: 600,
                    "&:hover": {
                      backgroundColor: "#f4f3ef",
                    },
                  },
                }}
              >
                <ListItemText
                  primary={item.label}
                  slotProps={{
                    primary: {
                      sx: {
                        fontSize: "14px",
                        fontWeight: isSelected ? 600 : 400,
                        color: "#111827",
                        fontFamily: "'Space Grotesk', sans-serif",
                      },
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}

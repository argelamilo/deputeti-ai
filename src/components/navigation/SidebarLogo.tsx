// Optimized: Direct import instead of barrel import
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Image from "next/image";

interface SidebarLogoProps {
  logoSrc?: string;
  alt?: string;
  width?: number;
  height?: number;
}

export function SidebarLogo({
  logoSrc = "/Albanian_eagle.png",
  alt = "Avokati AI Logo",
  width = 34,
  height = 26,
}: SidebarLogoProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, pt: 2.4, pb: 2.2, px: 2.5 }}>
      <Box sx={{ width, height }}>
        <Image src={logoSrc} alt={alt} width={width} height={height} style={{ objectFit: "contain" }} priority />
      </Box>
     
    </Box>
  );
}

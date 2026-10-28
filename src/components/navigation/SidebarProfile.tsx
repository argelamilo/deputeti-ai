"use client";

import { useEffect, useRef, useState } from "react";
// Optimized: Direct imports instead of barrel imports
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";

interface SidebarProfileProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export function SidebarProfile({ user }: SidebarProfileProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setProfileImage(localStorage.getItem(`profilePicture_${user.email}`) || null);
  }, [user.email]);

  // Get initials from user name
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  // Handle profile picture upload
  const handleProfileImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        setProfileImage(imageData);
        if (typeof window !== "undefined") {
          localStorage.setItem(`profilePicture_${user.email}`, imageData);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle avatar click to trigger file input
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box sx={{ padding: "16px" }}>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={handleProfileImageChange}
      />
      <Avatar
        onClick={handleAvatarClick}
        src={profileImage || undefined}
        sx={{
          width: "100%",
          height: 120,
          borderRadius: "8px",
          backgroundColor: "#111111",
          fontSize: "2rem",
          fontWeight: 600,
          cursor: "pointer",
          transition: "transform 0.2s",
          "&:hover": {
            transform: "scale(1.02)",
          },
        }}
      >
        {!profileImage ? initials : null}
      </Avatar>
    </Box>
  );
}

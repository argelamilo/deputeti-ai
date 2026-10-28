"use client";

import { Logout } from "@mui/icons-material";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import { useEffect, useRef, useState } from "react";


interface UserMenuProps {
  user?: {
    id: string;
    email: string;
    company_name?: string;
    client_id?: string;
  };
  onLogout?: () => void;
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    setIsOpen(false);
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* User Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center rounded-[8px] sm:rounded-[10px] p-2 sm:p-3 transition-all hover:bg-gray-200"
        style={{
          backgroundColor: "#f3f4f6",
          width: "36px",
          height: "36px",
          border: "1px solid #dbd9d5",
          cursor: "pointer",
        }}
      >
          <AccountCircleRoundedIcon sx={{ fontSize: { xs: 20, sm: 22 }, color: "#374151" }} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 rounded-[8px] sm:rounded-[10px] shadow-lg border border-gray-200"
          style={{
            backgroundColor: "#ffffff",
            zIndex: 50,
          }}
        >
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-gray-700 transition-all hover:bg-gray-100 whitespace-nowrap"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "0.85rem",
            }}
          >
            <Logout sx={{ fontSize: { xs: 14, sm: 16 }, color: "#374151" }} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

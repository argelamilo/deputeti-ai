"use client";

import {
  CircularProgress,
  IconButton,
  Paper,
  TextField,
  Box,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import type { KeyboardEvent } from "react";
import { useEffect, useRef } from "react";

interface ComposerBarProps {
  loading: boolean;
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: KeyboardEvent) => void;
  focusInputSignal?: number;
}

export function ComposerBar({ loading, input, onInputChange, onSend, onKeyDown, focusInputSignal = 0 }: ComposerBarProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!focusInputSignal) return;
    inputRef.current?.focus();
  }, [focusInputSignal]);

  return (
    <Box sx={{ px: { xs: 1.4, sm: 2.5 }, py: { xs: 1.4, sm: 2 }, position: "sticky", bottom: 0, zIndex: 3 }}>
      <Paper
        sx={{
          maxWidth: 780,
          mx: "auto",
          display: "flex",
          alignItems: "flex-end",
          gap: 1,
          px: { xs: 1, sm: 1.2 },
          py: 0.85,
          borderRadius: 99,
          boxShadow: "0 8px 26px rgba(20, 20, 20, 0.08)",
          backdropFilter: "blur(3px)",
        }}
      >
        <TextField
          multiline
          minRows={1}
          maxRows={6}
          fullWidth
          variant="standard"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={loading}
          placeholder="Shkruani pyetjen tuaj..."
          inputRef={inputRef}
          InputProps={{
            disableUnderline: true,
            sx: {
              pl: 2.2,
              "& .MuiInputBase-input": {
                pl: 0,
              },
              "& .MuiInputBase-inputMultiline": {
                pl: 0,
              },
            },
          }}
          sx={{
            "& .MuiInputBase-input": {
              pl: 0,
              pr: 1,
              fontSize: "0.94rem",
            },
          }}
        />
        <IconButton
          onClick={onSend}
          disabled={!input.trim() || loading}
          sx={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            bgcolor: "hsl(var(--primary))",
            color: "hsl(var(--primary-foreground))",
            "&:hover": {
              bgcolor: "hsl(var(--primary))",
              filter: "brightness(1.08)",
            },
            "&:focus-visible": {
              outline: "2px solid hsl(var(--ring))",
              outlineOffset: "2px",
            },
            "&.Mui-disabled": {
              bgcolor: "hsl(var(--primary))",
              color: "hsl(var(--primary-foreground))",
              opacity: 0.65,
            },
          }}
        >
          {loading ? <CircularProgress size={16} sx={{ color: "inherit" }} /> : <SendIcon sx={{ fontSize: 18 }} />}
        </IconButton>
      </Paper>
    </Box>
  );
}

import type { Config } from "tailwindcss";

const config: Config = {
  // Content paths for Tailwind to scan
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    // Container configuration for responsive layouts
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },

    extend: {
      // 🎨 Color System - Based on SHFA Design System
      colors: {
        // Semantic colors using CSS variables for theme switching
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        // Card components
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // Popover components
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },

        // Primary brand colors
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },

        // Secondary brand colors
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },

        // Muted colors for subtle backgrounds
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },

        // Accent colors for highlights
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },

        // Destructive/error states
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },

        // Form elements
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        // Status colors
        success: "#219653",
        warning: "#FFA70B",
        danger: "#D34053",

        // Body text colors
        body: "#64748B",
        bodydark: "#AEB7C0",
        bodydark1: "#DEE4EE",
        bodydark2: "#8A99AF",

        // Stroke colors
        stroke: "#E2E8F0",

        // Extended gray palette
        gray: {
          "2": "#F7F9FC",
          "3": "#FAFBFC",
        },

        // Meta colors for various UI states
        "meta-1": "#DC3545", // Error/Delete
        "meta-2": "#EFF2F7", // Background
        "meta-3": "#10B981", // Success
        "meta-4": "#313D4A", // Dark text
        "meta-5": "#259AE6", // Info
        "meta-6": "#FFBA00", // Warning
        "meta-7": "#FF6766", // Alert
        "meta-8": "#F0950C", // Orange
        "meta-9": "#E5E7EB", // Light gray
        "meta-10": "#0FADCF", // Cyan

        // Chart colors
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },

      // 📏 Border Radius System
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      // 🔤 Typography System
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Space Grotesk", "sans-serif"],
        mono: ["var(--font-geist-mono)", "Space Mono", "monospace"],
      },

      fontSize: {
        // Title sizes
        "title-xxl": ["44px", { lineHeight: "55px" }],
        "title-xl": ["36px", { lineHeight: "45px" }],
        "title-xl2": ["33px", { lineHeight: "45px" }],
        "title-lg": ["28px", { lineHeight: "35px" }],
        "title-md": ["24px", { lineHeight: "30px" }],
        "title-md2": ["26px", { lineHeight: "30px" }],
        "title-sm": ["20px", { lineHeight: "26px" }],
        "title-xsm": ["18px", { lineHeight: "24px" }],
      },

      // 📐 Spacing System - Extended for dashboard layouts
      spacing: {
        // Half sizes
        "4.5": "18px",
        "5.5": "22px",
        "6.5": "26px",
        "7.5": "30px",
        "8.5": "34px",
        "9.5": "38px",
        "10.5": "42px",
        "11.5": "46px",
        "12.5": "50px",
        "13.5": "54px",
        "14.5": "58px",
        "15.5": "62px",
        "16.5": "66px",
        "17.5": "70px",
        "18.5": "74px",
        "19.5": "78px",
        "21.5": "86px",
        "22.5": "90px",
        "25.5": "102px",
        "27.5": "110px",
        "32.5": "130px",
        "37.5": "150px",
        "42.5": "170px",
        "47.5": "190px",
        "52.5": "210px",
        "57.5": "230px",
        "62.5": "250px",
        "67.5": "270px",
        "72.5": "290px",
        "87.5": "350px",
        "92.5": "370px",
        "97.5": "390px",
        "102.5": "410px",
        "132.5": "530px",
        "171.5": "686px",
        "187.5": "750px",
        "242.5": "970px",

        // Larger sizes
        "13": "52px",
        "15": "60px",
        "17": "68px",
        "18": "72px",
        "19": "76px",
        "21": "84px",
        "22": "88px",
        "25": "100px",
        "26": "104px",
        "27": "108px",
        "34": "136px",
        "35": "140px",
        "40": "160px",
        "45": "180px",
        "50": "200px",
        "55": "220px",
        "60": "240px",
        "65": "260px",
        "70": "280px",
        "75": "300px",
        "80": "320px",
        "85": "340px",
        "90": "360px",
        "95": "380px",
        "100": "400px",
        "105": "420px",
        "110": "440px",
        "115": "460px",
        "125": "500px",
        "150": "600px",
        "180": "720px",
        "203": "812px",
        "230": "920px",
      },

      // 📏 Max Width System
      maxWidth: {
        "3": "12px",
        "4": "16px",
        "11": "44px",
        "13": "52px",
        "14": "56px",
        "15": "60px",
        "25": "100px",
        "30": "120px",
        "34": "136px",
        "35": "140px",
        "40": "160px",
        "44": "176px",
        "45": "180px",
        "70": "280px",
        "90": "360px",
        "94": "376px",
        "125": "500px",
        "150": "600px",
        "180": "720px",
        "203": "812px",
        "230": "920px",
        "270": "1080px",
        "280": "1120px",
        "2.5": "10px",
        "22.5": "90px",
        "42.5": "170px",
        "132.5": "530px",
        "142.5": "570px",
        "242.5": "970px",
        "292.5": "1170px",
      },

      // 🎭 Box Shadow System
      boxShadow: {
        default: "0px 8px 13px -3px rgba(0, 0, 0, 0.07)",
        card: "0px 1px 3px rgba(0, 0, 0, 0.12)",
        "card-2": "0px 1px 2px rgba(0, 0, 0, 0.05)",
        switcher: "0px 2px 4px rgba(0, 0, 0, 0.2)",
        "shadow-default": "0px 8px 13px -3px rgba(0, 0, 0, 0.07)",
      },

      // 🔢 Z-Index System
      zIndex: {
        "1": "1",
        "9": "9",
        "99": "99",
        "999": "999",
        "9999": "9999",
        "99999": "99999",
        "999999": "999999",
      },

      // ✨ Animation System
      keyframes: {
        // Accordion animations
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },

        // Shimmer loading effect
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },

        // Fast pulse effect
        "pulse-fast": {
          "0%, 100%": { opacity: "1", transform: "scaleX(0.3)" },
          "50%": { opacity: "0.8", transform: "scaleX(1)" },
        },

        // Float animation
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },

        // Slide in from right
        "slide-in": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },

        // Slide out to right
        "slide-out": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(100%)" },
        },

        // Fade in
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },

        // Fade out
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },

        // Scale up
        "scale-up": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },

        // Scale down
        "scale-down": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(0.95)", opacity: "0" },
        },
      },

      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "shimmer": "shimmer 2s ease-in-out infinite",
        "pulse-fast": "pulse-fast 1s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "slide-in": "slide-in 0.3s ease-out",
        "slide-out": "slide-out 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "fade-out": "fade-out 0.2s ease-out",
        "scale-up": "scale-up 0.2s ease-out",
        "scale-down": "scale-down 0.2s ease-out",
      },

      // 🎨 Background Images
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-dashboard": "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        "gradient-card": "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
      },

      // 🔄 Transitions
      transitionProperty: {
        "height": "height",
        "spacing": "margin, padding",
      },
    },
  },

  // 🔌 Plugins
  plugins: [
    require("tailwindcss-animate"),
  ],
};

export default config;

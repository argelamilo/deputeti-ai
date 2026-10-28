import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Package,
  ShoppingCart,
  Target,
  Activity,
  BarChart3,
  AlertCircle,
  Home,
  Building,
  Percent,
  Tag,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronUp,
  ChevronDown,
  Calendar,
  PieChart,
  LineChart,
  AreaChart,
  X,
  XCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";

/**
 * Icon Mapping Utility
 * Maps string icon names to lucide-react icon components
 * Allows backend to specify icons dynamically via string names
 *
 * NOTE: For MUI icons (matching root frontend exactly), use muiIconMap.tsx
 */

export const iconMap: Record<string, LucideIcon> = {
  // Trends
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ChevronUp,
  ChevronDown,

  // Financial
  DollarSign,
  Target,
  Tag,
  Percent,

  // Business
  Users,
  Package,
  ShoppingCart,
  Home,
  Building,
  Activity,
  Clock,

  // Charts
  BarChart3,
  PieChart,
  LineChart,
  AreaChart,

  // Status Icons (for badges)
  AlertCircle,
  X,
  XCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  Calendar,

  // Simple status icon names (for database references)
  check: CheckCircle,
  alert: AlertTriangle,
  x: XCircle,
};

/**
 * Get Icon Component by Name
 * Returns the icon component or a default icon if not found
 */
export function getIcon(
  iconName: string,
  defaultIcon: LucideIcon = BarChart3
): LucideIcon {
  return iconMap[iconName] || defaultIcon;
}

/**
 * Render Icon with Props
 * Helper to render an icon with consistent styling
 */
export function renderIcon(
  iconName: string,
  className?: string,
  color?: string,
  style?: React.CSSProperties
) {
  const Icon = getIcon(iconName);
  return <Icon className={className} color={color} style={style} />;
}

/**
 * Icon Color Presets
 * Common color combinations from root frontend
 */
export const iconColorPresets = {
  green: {
    color: "#43a047",
    bgColor: "#ecfdf5",
  },
  blue: {
    color: "#1976d2",
    bgColor: "#eff6ff",
  },
  orange: {
    color: "#f59e0b",
    bgColor: "#fff7ed",
  },
  red: {
    color: "#ef4444",
    bgColor: "#fef2f2",
  },
  purple: {
    color: "#8b5cf6",
    bgColor: "#f3e8ff",
  },
  yellow: {
    color: "#eab308",
    bgColor: "#fef3c7",
  },
  gray: {
    color: "#6b7280",
    bgColor: "#f9fafb",
  },
};

/**
 * Get Icon Color Preset
 */
export function getIconColorPreset(
  presetName: keyof typeof iconColorPresets = "blue"
) {
  return iconColorPresets[presetName] || iconColorPresets.blue;
}

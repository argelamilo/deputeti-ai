/**
 * KPI Type Definitions
 * Type system for KPI widgets and metrics
 */

/**
 * KPI Value - Single KPI metric
 */
export interface KPIValue {
  value: number;
  formatted_value?: string;
  label: string;
  description?: string;
  format?: KPIFormat;
  trend?: KPITrend;
  comparison?: KPIComparison;
  sparkline?: number[];
  status?: KPIStatus;
  icon?: string;
  color?: string;
  unit?: string;
}

/**
 * KPI Format - How to display the value
 */
export type KPIFormat = "number" | "currency" | "percentage" | "custom";

/**
 * KPI Status - Visual status indicator
 */
export type KPIStatus = "success" | "warning" | "danger" | "info" | "neutral";

/**
 * KPI Trend - Trend information
 */
export interface KPITrend {
  direction: "up" | "down" | "neutral";
  value: number;
  formatted_value?: string;
  label?: string;
  is_positive?: boolean; // Whether this trend is good (depends on context)
}

/**
 * KPI Comparison - Comparison with previous period
 */
export interface KPIComparison {
  previous_value: number;
  current_value: number;
  change_value: number;
  change_percentage: number;
  formatted_change?: string;
  period_label?: string; // e.g., "vs last month"
}

/**
 * KPI Card Props - Component props for KPI card
 */
export interface KPICardProps {
  kpi: KPIValue;
  variant?: "default" | "compact" | "detailed";
  showTrend?: boolean;
  showComparison?: boolean;
  showSparkline?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * KPI Group - Multiple related KPIs
 */
export interface KPIGroup {
  id: string;
  title: string;
  description?: string;
  kpis: KPIValue[];
  layout?: "grid" | "list" | "carousel";
  columns?: number;
}

/**
 * KPI Chart Data - Data for trend visualization
 */
export interface KPIChartData {
  labels: string[];
  datasets: KPIDataset[];
}

/**
 * KPI Dataset - Single dataset for charts
 */
export interface KPIDataset {
  label: string;
  data: number[];
  color?: string;
  borderColor?: string;
  backgroundColor?: string;
  fill?: boolean;
}

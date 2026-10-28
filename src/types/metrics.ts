/**
 * Metric Definition Types
 * Maps to backend metric_definitions table
 * Used for dynamically rendering metrics based on database configuration
 */

import { ChartDisplayOptions, KPIDisplayOptions, TableDisplayOptions } from './dashboard';

/**
 * Core metric definition from database
 */
export interface MetricDefinition {
  // Identity
  metric_id: string;
  tenant_id: string;
  metric_name: string;
  display_name: string;
  description?: string;
  category?: string;

  // Query linkage
  query_id: string;

  // Caching strategy
  is_cacheable: boolean;
  cache_strategy: 'scheduled' | 'on_demand' | 'hybrid' | 'none';
  cache_time_periods: string[];
  cache_ttl_seconds: number;
  update_frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  update_priority: number; // 0-100

  // Display configuration
  component_types: ComponentType[];
  default_component: ComponentType;
  display_format: DisplayFormat;

  // Component-specific configurations
  chart_config?: ChartConfig;
  table_config?: TableConfig;
  card_config?: CardConfig;
  gauge_config?: GaugeConfig;

  // Data manipulation
  sorting_rules?: SortingRule;
  grouping_rules?: GroupingRule;
  filter_config?: FilterConfig;

  // Formatting and thresholds
  formatting_rules?: FormattingRules;
  thresholds?: Thresholds;

  // Visual styling
  icon?: string;
  color?: string;
  display_order: number;

  // Metadata
  is_active: boolean;
  time_series_enabled: boolean;
  time_series_granularities: string[];
  created_at: string;
  updated_at: string;
}

/**
 * Supported component types
 */
export type ComponentType =
  | 'kpi_card'
  | 'line_chart'
  | 'area_chart'
  | 'bar_chart'
  | 'table'
  | 'gauge'
  | 'pie_chart'
  | 'donut_chart';

/**
 * Display format types
 */
export type DisplayFormat =
  | 'number'
  | 'currency'
  | 'percentage'
  | 'decimal'
  | 'integer'
  | 'text'
  | 'date'
  | 'datetime'
  | 'duration';

/**
 * Chart configuration (extends dashboard ChartDisplayOptions)
 */
export interface ChartConfig extends Partial<ChartDisplayOptions> {
  xAxis?: string;
  yAxis?: string | string[];
  dataKey?: string;
  valueFormatter?: string; // Format for values (e.g., "currency", "percentage")
  labelFormatter?: string; // Format for labels
  colors?: string[];
  showPoints?: boolean;
  smooth?: boolean;
  stacked?: boolean;
  fillOpacity?: number;
}

/**
 * Table configuration (extends dashboard TableDisplayOptions)
 */
export interface TableConfig extends Partial<TableDisplayOptions> {
  defaultSortField?: string;
  defaultSortOrder?: 'asc' | 'desc';
  rowsPerPage?: number;
  enableExport?: boolean;
  compactMode?: boolean;
}

/**
 * Card configuration (extends dashboard KPIDisplayOptions)
 */
export interface CardConfig extends Partial<KPIDisplayOptions> {
  showTrend?: boolean;
  showComparison?: boolean;
  showSparkline?: boolean;
  size?: 'small' | 'medium' | 'large';
  iconBgColor?: string;
  valueSize?: 'small' | 'medium' | 'large';
  showDateSelector?: boolean;
  drilldown?: DrilldownConfig;
}

/**
 * Drilldown configuration for interactive metrics
 */
export interface DrilldownConfig {
  enabled: boolean;
  type: 'occupancy_breakdown' | 'mrr_details' | 'revenue_per_sqft' | 'revenue_per_desk' | 'member_details' | string;
}

/**
 * Gauge configuration
 */
export interface GaugeConfig {
  min: number;
  max: number;
  target?: number;
  zones?: GaugeZone[];
  showValue?: boolean;
  showTarget?: boolean;
  unit?: string;
}

export interface GaugeZone {
  from: number;
  to: number;
  color: string;
  label?: string;
}

/**
 * Sorting rules
 */
export interface SortingRule {
  field: string;
  order: 'asc' | 'desc';
  nullsFirst?: boolean;
}

/**
 * Grouping rules
 */
export interface GroupingRule {
  field: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

/**
 * Filter configuration
 */
export interface FilterConfig {
  availableFilters?: FilterDefinition[];
  defaultFilters?: Record<string, any>;
}

export interface FilterDefinition {
  field: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect';
  options?: Array<{ label: string; value: any }>;
}

/**
 * Formatting rules
 */
export interface FormattingRules {
  decimals?: number;
  prefix?: string;
  suffix?: string;
  currency?: string;
  locale?: string;
  dateFormat?: string;
  timeFormat?: string;
  abbreviate?: boolean; // e.g., 1000 → 1K
}

/**
 * Threshold definitions for color coding
 */
export interface Thresholds {
  success?: ThresholdCondition;
  warning?: ThresholdCondition;
  danger?: ThresholdCondition;
}

export interface ThresholdCondition {
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq' | 'between';
  value: number | [number, number];
  color?: string;
}

/**
 * Metric data fetching parameters
 */
export interface MetricDataParams {
  as_of_date?: string;
  property_filter?: string | null;
  location_filter?: string | null;
  time_period?: string; // e.g., "current_month", "last_90_days"
  start_date?: string;
  end_date?: string;
  [key: string]: any; // Allow additional custom parameters
}

/**
 * Metric data response
 */
export interface MetricDataResponse<T = any> {
  metric_name: string;
  display_name: string;
  data: T;
  metadata?: MetricMetadata;
  cached?: boolean;
  calculated_at: string;
}

/**
 * Metadata about the metric data
 */
export interface MetricMetadata {
  execution_time_ms?: number;
  row_count?: number;
  cache_age_seconds?: number;
  expires_at?: string;
  is_stale?: boolean;
  filters_applied?: Record<string, any>;
}

/**
 * Formatted metric value (for display)
 */
export interface FormattedMetricValue {
  value: any;
  formatted: string;
  unit?: string;
  status?: 'success' | 'warning' | 'danger' | 'neutral';
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: number;
    formatted: string;
  };
}

/**
 * Metric value with time series data
 */
export interface TimeSeriesMetricData {
  value: number;
  date: string;
  [key: string]: any;
}

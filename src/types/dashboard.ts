/**
 * Dashboard Type Definitions
 * Complete type system for the reusable dashboard architecture
 */

/**
 * Widget Types - All supported widget/component types
 */
export type WidgetType =
  | "kpi"
  | "chart"
  | "table"
  | "map"
  | "list"
  | "stat"
  | "metric"
  | "grid";

/**
 * Chart Types - All supported chart visualizations
 */
export type ChartType =
  | "line"
  | "area"
  | "bar"
  | "pie"
  | "donut"
  | "scatter"
  | "combo";

/**
 * Time Period Presets - Standard time periods for filtering
 */
export type TimePeriod =
  | "today"
  | "yesterday"
  | "last_7_days"
  | "last_30_days"
  | "last_90_days"
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "last_quarter"
  | "this_year"
  | "last_year"
  | "custom";

/**
 * Filter Operators - All supported filter operations
 */
export type FilterOperator =
  | "equals"
  | "not_equals"
  | "greater_than"
  | "less_than"
  | "greater_than_or_equal"
  | "less_than_or_equal"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "in"
  | "not_in"
  | "between"
  | "is_null"
  | "is_not_null"
  | "is_empty";

/**
 * Dashboard Filter - Single filter definition
 */
export interface DashboardFilter {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string | number | boolean | null | (string | number)[];
  label?: string;
}

/**
 * Dashboard Configuration - Complete dashboard definition from backend
 */
export interface DashboardConfig {
  id: string;
  name: string;
  description?: string;
  tenant_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_default: boolean;
  layout: DashboardLayout;
  widgets: WidgetConfig[];
  filters?: DashboardFilter[];
  refresh_interval?: number; // Auto-refresh in seconds
  theme?: "light" | "dark" | "auto";
}

/**
 * Dashboard Layout - Grid layout configuration
 */
export interface DashboardLayout {
  type: "grid" | "flex" | "custom";
  columns: number;
  gap: number;
  responsive?: ResponsiveLayout;
}

/**
 * Responsive Layout - Breakpoint-specific layouts
 */
export interface ResponsiveLayout {
  sm?: Partial<DashboardLayout>;
  md?: Partial<DashboardLayout>;
  lg?: Partial<DashboardLayout>;
  xl?: Partial<DashboardLayout>;
}

/**
 * Widget Configuration - Base widget definition
 */
export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  position: WidgetPosition;
  data_source: DataSource;
  display_options: DisplayOptions;
  permissions?: WidgetPermissions;
}

/**
 * Widget Position - Grid position and size
 */
export interface WidgetPosition {
  row: number;
  col: number;
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

/**
 * Data Source - Where widget gets its data
 */
export interface DataSource {
  type: "api" | "static" | "computed";
  endpoint?: string;
  method?: "GET" | "POST";
  params?: Record<string, unknown>;
  refresh_interval?: number;
  cache_ttl?: number;
  transform?: string; // Function name for data transformation
}

/**
 * Display Options - Widget-specific display configuration
 */
export interface DisplayOptions {
  // Common options
  show_title?: boolean;
  show_description?: boolean;
  show_border?: boolean;
  show_shadow?: boolean;

  // KPI specific
  kpi?: KPIDisplayOptions;

  // Chart specific
  chart?: ChartDisplayOptions;

  // Table specific
  table?: TableDisplayOptions;

  // Custom styling
  className?: string;
  style?: React.CSSProperties;
}

/**
 * KPI Display Options
 */
export interface KPIDisplayOptions {
  show_trend?: boolean;
  show_comparison?: boolean;
  show_sparkline?: boolean;
  format?: "number" | "currency" | "percentage" | "custom";
  currency?: string;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  icon?: string;
  color_scheme?: "default" | "success" | "warning" | "danger" | "info";
  trend_direction?: "up" | "down" | "neutral";
}

/**
 * Chart Display Options
 */
export interface ChartDisplayOptions {
  chart_type: ChartType;
  show_legend?: boolean;
  show_grid?: boolean;
  show_tooltip?: boolean;
  show_axes?: boolean;
  height?: number;
  colors?: string[];
  x_axis?: AxisConfig;
  y_axis?: AxisConfig;
  stacked?: boolean;
  smooth?: boolean;
}

/**
 * Axis Configuration
 */
export interface AxisConfig {
  key?: string;      // The data key to use (e.g., 'month', 'value')
  label?: string;    // Display label for the axis
  format?: string;
  min?: number;
  max?: number;
  hide?: boolean;
}

/**
 * Table Display Options
 */
export interface TableDisplayOptions {
  columns: TableColumn[];
  sortable?: boolean;
  filterable?: boolean;
  paginated?: boolean;
  page_size?: number;
  row_selection?: boolean;
  show_search?: boolean;
}

/**
 * Table Column Definition
 */
export interface TableColumn {
  id: string;
  header: string;
  accessor: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  format?: "text" | "number" | "currency" | "percentage" | "date" | "custom";
  align?: "left" | "center" | "right";
}

/**
 * Widget Permissions
 */
export interface WidgetPermissions {
  view?: string[]; // Role IDs that can view
  edit?: string[]; // Role IDs that can edit
  delete?: string[]; // Role IDs that can delete
}

/**
 * Widget Data - Generic data structure returned from API
 */
export interface WidgetData<T = unknown> {
  widget_id: string;
  data: T;
  metadata?: WidgetMetadata;
  error?: string;
  timestamp: string;
}

/**
 * Widget Metadata - Additional context about the data
 */
export interface WidgetMetadata {
  total_count?: number;
  page?: number;
  page_size?: number;
  filters_applied?: DashboardFilter[];
  execution_time_ms?: number;
  cached?: boolean;
}

/**
 * Navigation Item - Sidebar navigation structure
 */
export interface NavigationItem {
  id: string;
  label: string;
  icon?: string;
  path?: string;
  badge?: string | number;
  children?: NavigationItem[];
  active?: boolean;
  disabled?: boolean;
  permissions?: string[];
  onClick?: () => void;
}

/**
 * User Context - Current user information
 */
export interface UserContext {
  id: string;
  email: string;
  tenant_id: string;
  roles: string[];
  permissions: string[];
  preferences?: UserPreferences;
}

/**
 * User Preferences - User-specific settings
 */
export interface UserPreferences {
  theme?: "light" | "dark" | "auto";
  locale?: string;
  timezone?: string;
  currency?: string;
  date_format?: string;
  number_format?: string;
}

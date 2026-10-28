/**
 * Multi-Tenant Type Definitions
 *
 * Generic types for tenant analytics and metrics
 * Used for API requests and responses across any tenant
 */

// Generic query parameters
export interface TenantQueryParams {
  tenant_id: string;
  as_of_date?: string; // ISO date format: "2025-01-15"
  property_filter?: string | null;
}

// Query response wrapper
export interface QueryResponse<T> {
  success: boolean;
  data: T;
  query_name: string;
  execution_time_ms: number;
  cached?: boolean;
}

// Aggregation query result (single numeric value)
export type AggregationResult = number;

// Tabular query result (array of rows)
export interface TableRow {
  [key: string]: any;
}
export type TabularResult = TableRow[];

// ==================== Specific Metric Types ====================

// Revenue by Month
export interface RevenueByMonth {
  month: string;
  mrr: number; // Monthly recurring revenue
  year?: number;
}

// Revenue by Membership Type
export interface RevenueByMembershipType {
  membership_type: string;
  total_revenue: number;
  member_count: number;
}

// Revenue by Property
export interface RevenueByProperty {
  property_name: string;
  total_revenue: number;
  occupancy_rate: number;
  available_spaces: number;
}

// Membership Status Breakdown
export interface MembershipStatusBreakdown {
  status: string;
  member_count: number;
  percentage: number;
}

// Space Utilization by Property
export interface SpaceUtilization {
  property_name: string;
  total_spaces: number;
  occupied_spaces: number;
  occupancy_rate: number;
  revenue_per_space: number;
}

// Top Members by Revenue
export interface TopMember {
  member_id: string;
  member_name: string;
  company_name: string;
  total_revenue: number;
  membership_type: string;
  spaces_occupied: number;
}

// Expiring Memberships
export interface ExpiringMembership {
  member_id: string;
  member_name: string;
  company_name: string;
  membership_type: string;
  expiry_date: string;
  monthly_revenue: number;
  days_until_expiry: number;
}

// Member Retention Cohort
export interface RetentionCohort {
  cohort_month: string;
  initial_members: number;
  retained_members: number;
  retention_rate: number;
  months_since_start: number;
}

// Daily Space Check-ins
export interface DailyCheckins {
  check_in_date: string;
  property_name: string;
  total_checkins: number;
  unique_members: number;
}

// ==================== Dashboard Composite Types ====================

// Overview metrics
export interface OverviewMetrics {
  totalRevenueMRR: number;
  totalSpaces: number;
  occupancyRate: number;
  averageMembershipDuration: number;
  revenuePerSpace: number;
  upcomingRenewals: number;
  churnRiskMembers: number;
  newMembersThisMonth: number;
  totalMembers: number;
  activeMembers: number;
}

// Chart data for revenue trends
export interface RevenueChartData {
  date: string;
  value: number;
}

// Member data for drilldowns
export interface MemberDetail {
  company_name: string;
  membership_type: string;
  member_qty: number;
  member_mrr: number;
  move_in_date: string;
  end_date: string;
  original_start_date: string;
  status: string;
}

// Building/Property data for drilldowns
export interface PropertyDetail {
  property_name: string;
  property_sqft: number;
  mrr: number;
  occupancy_pct: number;
  revenue_per_sqft: number;
}

// ==================== API Error Types ====================

export interface ApiError {
  success: false;
  error: string;
  detail?: string;
  status_code?: number;
}

// ==================== Metric Category Groups ====================

/**
 * Dashboard section/category configuration
 * Controls how metrics are grouped and displayed on the dashboard
 */
export interface MetricCategoryGroup {
  category_group_id: string;
  category_key: string;
  display_title: string;
  display_subtitle?: string;
  display_order: number;
  grid_columns: number;
  grid_gap: number;
  section_config?: Record<string, any>;
  is_active: boolean;
}

/**
 * Complete tenant configuration response
 */
export interface TenantConfig {
  tenant: {
    tenant_id: string;
    tenant_name: string;
    company_name: string;
    slug: string;
    settings: Record<string, any>;
    features: string[];
    branding: {
      logo: string;
      primaryColor: string;
      secondaryColor: string;
      dashboardTitle: string;
      locationLabel: string;
      spaceLabel: string;
      memberLabel: string;
    };
    display_preferences?: {
      show_last_updated?: boolean;
      last_updated_format?: 'relative' | 'absolute' | 'day_month'; // Time display format
      last_updated_position?: 'footer' | 'header'; // where to show it
    };
  };
  metrics: MetricDefinition[];
  category_groups: MetricCategoryGroup[];
  locations: TenantLocation[];
  queryMappings: Record<string, string>;
  filters: any[];
  dashboards: any[];
}

/**
 * Metric definition with full presentation metadata
 */
export interface MetricDefinition {
  metric_id: string;
  metric_name: string;
  display_name: string;
  description?: string;
  category: string;
  query_id: string;

  // Caching configuration
  is_cacheable: boolean;
  cache_strategy: 'scheduled' | 'on_demand' | 'hybrid' | 'none';

  // Component configuration
  component_types: string[];
  default_component: string;
  display_format: 'number' | 'currency' | 'percentage' | 'duration';

  // Display configurations
  card_config?: any;
  chart_config?: any;
  table_config?: any;
  gauge_config?: any;

  // Visual settings
  icon?: string;
  color?: string;
  display_order: number;

  // Time series capabilities
  time_series_enabled?: boolean;
  time_series_granularities?: string[];

  // Advanced features
  thresholds?: any;
  formatting_rules?: any;
  filter_config?: any;
}

/**
 * Tenant location/property
 */
export interface TenantLocation {
  id: string;
  name: string;
  slug: string;
  address?: string;
  city?: string;
  state?: string;
  external_property_id?: number;
}

// ==================== Constants ====================

// Generic query name mappings (use standardized metric names)
export const QUERY_NAMES = {
  // Aggregation queries - using generic names matching backend
  TOTAL_REVENUE_MRR: 'mrr',
  TOTAL_SPACES: 'total_spaces',
  OCCUPANCY_RATE: 'occupancy_rate',
  AVG_MEMBERSHIP_DURATION: 'avg_membership_duration',
  REVENUE_PER_SPACE: 'revenue_per_space',
  UPCOMING_RENEWALS: 'upcoming_renewals',
  CHURN_RISK_MEMBERS: 'churn_risk_members',
  NEW_MEMBERS_THIS_MONTH: 'new_members_this_month',
  TOTAL_MEMBERS: 'member_count',
  ACTIVE_MEMBERS: 'active_member_count',

  // Tabular queries - using generic names
  REVENUE_BY_MONTH: 'revenue_by_month',
  REVENUE_BY_MEMBERSHIP_TYPE: 'revenue_by_membership_type',
  REVENUE_BY_PROPERTY: 'revenue_by_property',
  MEMBERSHIP_STATUS_BREAKDOWN: 'membership_status_breakdown',
  SPACE_UTILIZATION_BY_PROPERTY: 'space_utilization_by_property',
  TOP_10_MEMBERS_BY_REVENUE: 'top_10_members_by_revenue',
  EXPIRING_MEMBERSHIPS_NEXT_90_DAYS: 'expiring_memberships_next_90_days',
  MEMBER_RETENTION_COHORT: 'member_retention_cohort',
  DAILY_SPACE_CHECKINS: 'daily_space_checkins',
} as const;

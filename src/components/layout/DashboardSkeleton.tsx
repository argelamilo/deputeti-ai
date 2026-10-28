/**
 * Dashboard Skeleton
 *
 * Full dashboard loading skeleton shown during initial SSR
 * Provides immediate visual feedback while data streams in
 */

import { MetricGridSkeleton } from "@/components/ui/MetricCardSkeleton";
import { ChartSkeleton, TableSkeleton } from "@/components/ui/ChartSkeleton";
import { DashboardContainer, DashboardGrid } from "./DashboardGrid";
import { SectionHeader } from "./SectionHeader";

export function DashboardSkeleton() {
  return (
    <DashboardContainer className="space-y-12">
      {/* KPI Section */}
      <div>
        <SectionHeader
          title="Key Performance Indicators"
          subtitle="Loading metrics..."
        />
        <DashboardGrid columns={4} gap={4}>
          <MetricGridSkeleton count={4} />
        </DashboardGrid>
      </div>

      {/* Revenue Section */}
      <div>
        <SectionHeader
          title="Revenue Metrics"
          subtitle="Loading revenue data..."
        />
        <DashboardGrid columns={3} gap={4}>
          <MetricGridSkeleton count={3} />
        </DashboardGrid>
      </div>

      {/* Charts Section */}
      <div>
        <SectionHeader
          title="Analytics"
          subtitle="Loading charts..."
        />
        <DashboardGrid columns={2} gap={4}>
          <ChartSkeleton />
          <ChartSkeleton />
        </DashboardGrid>
      </div>
    </DashboardContainer>
  );
}

/**
 * Section Skeleton
 *
 * Smaller skeleton for individual dashboard sections
 */
export function DashboardSectionSkeleton({
  title,
  subtitle,
  columns = 3,
  count = 3,
}: {
  title: string;
  subtitle?: string;
  columns?: 1 | 2 | 3 | 4 | 6 | 12;
  count?: number;
}) {
  return (
    <div>
      <SectionHeader title={title} subtitle={subtitle} />
      <DashboardGrid columns={columns} gap={4}>
        <MetricGridSkeleton count={count} />
      </DashboardGrid>
    </div>
  );
}

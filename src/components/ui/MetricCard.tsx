"use client";

import { cn } from "@/lib/utils/cn";
import { MetricHeader } from "./MetricHeader";
import { MetricIcon } from "./MetricIcon";
import { MetricBadge } from "./MetricBadge";
import { MetricValue } from "./MetricValue";
import { MetricSubtitle } from "./MetricSubtitle";

/**
 * MetricCard Component Props
 * Matches EXACT styling from root frontend /frontend/components/ui/KPICard.tsx
 */
export interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  subtitle?: string;
  icon?: string | React.ReactNode;
  iconBgColor?: string;
  badge?: string;
  showDateSelector?: boolean;
  currentTimeRange?: string;
  onDateRangeChange?: (range: string) => void;
  onCustomRangeChange?: (start: Date, end: Date) => void;
  customRangeLabel?: string;
  customRangeValue?: {
    startDate: string;
    endDate: string;
  } | null;
  className?: string;
  size?: "small" | "medium" | "large";
  onClick?: () => void;
}

/**
 * MetricCard Component
 * Exactly matches root frontend KPICard styling
 */
export function MetricCard({
  title,
  value,
  description,
  subtitle,
  icon,
  iconBgColor = "#eff6ff",
  badge,
  showDateSelector,
  currentTimeRange,
  onDateRangeChange,
  onCustomRangeChange,
  customRangeLabel,
  customRangeValue,
  className,
  size = "large",
  onClick,
}: MetricCardProps) {
  // Size configurations with responsive padding
  const sizeConfig = {
    small: { cardPadding: "p-3 sm:p-4" },
    medium: { cardPadding: "p-4 sm:p-6" },
    large: { cardPadding: "p-4 sm:p-6" },
  };

  const config = sizeConfig[size] || sizeConfig.large;

  return (
    <div
      className={cn(
        "bg-white rounded-lg shadow-default hover:shadow-md hover:bg-gray-50 transition-all duration-300 h-full flex flex-col border border-gray-300",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className={cn(config.cardPadding, "grow flex flex-col")}>
        {/* Header */}
        <MetricHeader
          title={title}
          showDateSelector={showDateSelector}
          currentTimeRange={currentTimeRange}
          onDateRangeChange={onDateRangeChange}
          onCustomRangeChange={onCustomRangeChange}
          customRangeLabel={customRangeLabel}
          customRangeValue={customRangeValue}
          size={size}
        />

        {/* Icon and Badge Row */}
        <div className="flex items-center justify-between mb-3">
          {icon && <MetricIcon icon={icon} iconBgColor={iconBgColor} size={size} />}
          {badge && <MetricBadge badge={badge} />}
        </div>

        {/* Value and Description */}
        <MetricValue value={value} description={description} size={size} />

        {/* Subtitle */}
        {subtitle && <MetricSubtitle subtitle={subtitle} size={size} />}
      </div>
    </div>
  );
}

/**
 * ChartCard Component
 * For chart visualizations matching root frontend style
 */
export interface ChartCardProps {
  title: string;
  icon?: string | React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, icon, children, className }: ChartCardProps) {
  return (
    <div className={cn(
      "bg-white rounded-lg shadow-default hover:shadow-md hover:bg-gray-50 transition-all duration-300 border border-gray-300 h-full flex flex-col",
      className
    )}>
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          {icon && (
            <span className="text-lg sm:text-xl">{icon}</span>
          )}
          <h3 className="text-xs sm:text-sm font-medium text-black">
            {title}
          </h3>
        </div>

        {/* Chart */}
        <div className="w-full">
          {children}
        </div>
      </div>
    </div>
  );
}

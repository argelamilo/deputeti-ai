"use client";

import { cn } from "@/lib/utils/cn";
import { ChartCardHeader } from "./ChartCardHeader";
import { ChartCardContent } from "./ChartCardContent";
import { DateRangeSelector } from "./DateRangeSelector";

/**
 * AdvancedChartCard Component
 * Matches EXACT styling from root frontend MRRTrendChart
 * For detailed chart visualizations with icon and title in header
 * Now supports optional date range selector
 */

export interface AdvancedChartCardProps {
  title: string;
  subtitle?: string | any;
  icon?: React.ReactNode;
  iconBgColor?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  showDateSelector?: boolean;
  currentTimeRange?: string;
  onDateRangeChange?: (range: string) => void;
  onCustomRangeChange?: (start: Date, end: Date) => void;
  customRangeLabel?: string;
  customRangeValue?: {
    startDate: string;
    endDate: string;
  } | null;
}

export function AdvancedChartCard({
  title,
  subtitle,
  icon,
  iconBgColor = "#ecfdf5",
  children,
  className,
  onClick,
  showDateSelector,
  currentTimeRange,
  onDateRangeChange,
  onCustomRangeChange,
  customRangeLabel,
  customRangeValue,
}: AdvancedChartCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-lg hover:shadow-md hover:bg-gray-50 transition-all duration-300 h-full flex flex-col",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="px-6 pt-4 pb-3 flex items-center justify-between">
        <ChartCardHeader title={title} subtitle={subtitle} icon={icon} iconBgColor={iconBgColor} />
        {showDateSelector && (
          <DateRangeSelector
            value={currentTimeRange as any}
            onChange={(range) => onDateRangeChange?.(range)}
            onCustomRange={(start, end) => onCustomRangeChange?.(start, end)}
            customRangeLabel={customRangeLabel}
            customRangeValue={customRangeValue}
            className="scale-90 origin-right"
          />
        )}
      </div>
      <ChartCardContent>{children}</ChartCardContent>
    </div>
  );
}

"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { KPICardProps, KPIStatus } from "@/types/kpi";

/**
 * KPICard Component
 * Reusable card component for displaying KPI metrics
 * Matches the design from the dashboard screenshots
 */
export function KPICard({
  kpi,
  showTrend = true,
  showComparison = true,
  showSparkline = false,
  className,
  onClick,
}: KPICardProps) {
  const {
    value,
    formatted_value,
    label,
    description,
    trend,
    comparison,
    status = "neutral",
    icon,
    color,
  } = kpi;

  // Determine the status color
  const statusColors: Record<KPIStatus, string> = {
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
    info: "text-meta-5",
    neutral: "text-body",
  };

  // Determine trend color based on direction and positivity
  const getTrendColor = () => {
    if (!trend) return "text-body";

    if (trend.direction === "neutral") return "text-body";

    // If trend is explicitly marked as positive/negative
    if (trend.is_positive !== undefined) {
      return trend.is_positive ? "text-success" : "text-danger";
    }

    // Default: up = green, down = red
    return trend.direction === "up" ? "text-success" : "text-danger";
  };

  // Get trend icon
  const getTrendIcon = () => {
    if (!trend) return null;

    switch (trend.direction) {
      case "up":
        return <TrendingUp className="h-4 w-4" />;
      case "down":
        return <TrendingDown className="h-4 w-4" />;
      case "neutral":
        return <Minus className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const displayValue = formatted_value || value.toString();

  return (
    <div
      className={cn(
        "kpi-card",
        "transition-all duration-200",
        onClick && "cursor-pointer hover-lift",
        className
      )}
      onClick={onClick}
    >
      {/* Icon and Value - matching screenshot layout */}
      <div className="flex items-start justify-between mb-3">
        {icon && (
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full shrink-0",
              color || "bg-meta-2"
            )}
          >
            <span className="text-xl">{icon}</span>
          </div>
        )}
      </div>

      {/* Value - Large and Bold */}
      <div className="mb-2">
        <h3
          className={cn(
            "text-[32px] leading-[1.2] font-bold tracking-tight",
            statusColors[status] || "text-black"
          )}
        >
          {displayValue}
        </h3>
      </div>

      {/* Label */}
      <div className="mb-1">
        <p className="text-sm font-medium text-gray-600">
          {label}
        </p>
      </div>

      {/* Description */}
      {description && (
        <div className="mb-3">
          <p className="text-xs text-gray-500">
            {description}
          </p>
        </div>
      )}

      {/* Trend and Comparison */}
      {(showTrend || showComparison) && (trend || comparison) && (
        <div className="flex items-center gap-2 text-sm">
          {/* Trend Indicator */}
          {showTrend && trend && (
            <div className={cn("flex items-center gap-1", getTrendColor())}>
              {getTrendIcon()}
              <span className="font-medium">
                {trend.formatted_value || `${trend.value}%`}
              </span>
            </div>
          )}

          {/* Comparison */}
          {showComparison && comparison && (
            <div className="flex items-center gap-1 text-gray-600">
              <span>
                {comparison.formatted_change ||
                  `${comparison.change_percentage > 0 ? "+" : ""}${comparison.change_percentage.toFixed(1)}%`}
              </span>
              {comparison.period_label && (
                <span className="text-xs text-gray-500">
                  {comparison.period_label}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sparkline (if enabled) */}
      {showSparkline && kpi.sparkline && kpi.sparkline.length > 0 && (
        <div className="mt-3">
          <MiniSparkline data={kpi.sparkline} color={color} />
        </div>
      )}
    </div>
  );
}

/**
 * Mini Sparkline Component
 * Simple SVG sparkline for trend visualization
 */
function MiniSparkline({
  data,
  color = "#3B82F6",
}: {
  data: number[];
  color?: string;
}) {
  if (data.length === 0) return null;

  const width = 100;
  const height = 24;
  const padding = 2;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
      const y =
        height -
        padding -
        ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="opacity-60"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Compact KPI Card variant
 * For use in dense dashboards
 */
export function CompactKPICard({
  kpi,
  className,
  onClick,
}: Omit<KPICardProps, "variant">) {
  return (
    <KPICard
      kpi={kpi}
      variant="compact"
      showTrend={true}
      showComparison={false}
      showSparkline={false}
      className={className}
      onClick={onClick}
    />
  );
}

/**
 * Detailed KPI Card variant
 * For use in focus areas with more information
 */
export function DetailedKPICard({
  kpi,
  className,
  onClick,
}: Omit<KPICardProps, "variant">) {
  return (
    <KPICard
      kpi={kpi}
      variant="detailed"
      showTrend={true}
      showComparison={true}
      showSparkline={true}
      className={className}
      onClick={onClick}
    />
  );
}

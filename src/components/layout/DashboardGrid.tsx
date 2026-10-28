"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

/**
 * DashboardGrid Component
 * Responsive grid layout for dashboard widgets
 * Supports flexible column layouts and gap spacing
 */

interface DashboardGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: number;
  className?: string;
}

export function DashboardGrid({
  children,
  columns = 3,
  gap = 4,
  className,
}: DashboardGridProps) {
  // Map columns to Tailwind classes
  const columnClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    6: "grid-cols-1 md:grid-cols-3 lg:grid-cols-6",
    12: "grid-cols-1 md:grid-cols-6 lg:grid-cols-12",
  };

  // Map gap to Tailwind classes
  // Also handle pixel values from database (e.g., 16px -> 4, 24px -> 6)
  const gapClasses = {
    2: "gap-2",
    3: "gap-3",
    4: "gap-4",
    5: "gap-5",
    6: "gap-6",
    8: "gap-8",
    // Handle pixel values
    16: "gap-4",  // 16px = gap-4
    24: "gap-6",  // 24px = gap-6
    32: "gap-8",  // 32px = gap-8
  };

  return (
    <div
      className={cn(
        "grid",
        columnClasses[columns],
        gapClasses[gap as keyof typeof gapClasses] || "gap-4",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * DashboardSection Component
 * Section wrapper with title and optional actions
 */

interface DashboardSectionProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function DashboardSection({
  title,
  description,
  actions,
  children,
  className,
}: DashboardSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      {(title || description || actions) && (
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h2 className="text-xl font-semibold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {title}
            </h2>
          )}
          {description && (
            <p className="text-sm text-gray-600" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {description}
            </p>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * GridItem Component
 * Individual grid item with responsive span support
 */

interface GridItemProps {
  children: React.ReactNode;
  colSpan?: 1 | 2 | 3 | 4 | 6 | 12;
  rowSpan?: 1 | 2 | 3 | 4;
  className?: string;
}

export function GridItem({
  children,
  colSpan = 1,
  rowSpan = 1,
  className,
}: GridItemProps) {
  const colSpanClasses = {
    1: "col-span-1",
    2: "col-span-1 md:col-span-2",
    3: "col-span-1 md:col-span-2 lg:col-span-3",
    4: "col-span-1 md:col-span-2 lg:col-span-4",
    6: "col-span-1 md:col-span-3 lg:col-span-6",
    12: "col-span-1 md:col-span-6 lg:col-span-12",
  };

  const rowSpanClasses = {
    1: "row-span-1",
    2: "row-span-2",
    3: "row-span-3",
    4: "row-span-4",
  };

  return (
    <div
      className={cn(
        colSpanClasses[colSpan],
        rowSpanClasses[rowSpan],
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * DashboardContainer Component
 * Main container for dashboard layout with padding and max-width
 */

interface DashboardContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardContainer({
  children,
  className,
}: DashboardContainerProps) {
  return (
    <div className={cn("container mx-auto px-3 sm:px-6 py-2 sm:py-3 flex flex-col", className)}>
      {children}
    </div>
  );
}

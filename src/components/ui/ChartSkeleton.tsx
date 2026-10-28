/**
 * Chart Skeleton
 *
 * Loading placeholder for chart components during SSR streaming
 * Mimics the shape of bar/line charts
 */

export function ChartSkeleton() {
  // Keep placeholder deterministic to avoid hydration mismatch.
  const barHeights = [72, 54, 88, 63, 79, 47, 91, 66];
  return (
    <div
      className="bg-white rounded-lg p-6 shadow-sm border border-stroke animate-pulse"
      role="status"
      aria-label="Loading chart"
    >
      {/* Chart header */}
      <div className="mb-6">
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>

      {/* Chart bars/lines placeholder */}
      <div className="flex items-end justify-between h-48 space-x-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-gray-300 rounded-t"
            style={{
              height: `${barHeights[i]}%`,
            }}
          />
        ))}
      </div>

      {/* X-axis labels placeholder */}
      <div className="flex justify-between mt-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-3 bg-gray-200 rounded w-12" />
        ))}
      </div>

      <span className="sr-only">Loading chart...</span>
    </div>
  );
}

/**
 * Table Skeleton
 *
 * Loading placeholder for data tables
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div
      className="bg-white rounded-lg p-6 shadow-sm border border-stroke animate-pulse"
      role="status"
      aria-label="Loading table"
    >
      {/* Table header */}
      <div className="flex justify-between mb-4 pb-4 border-b border-stroke">
        <div className="h-4 bg-gray-200 rounded w-32" />
        <div className="h-4 bg-gray-200 rounded w-24" />
        <div className="h-4 bg-gray-200 rounded w-28" />
        <div className="h-4 bg-gray-200 rounded w-20" />
      </div>

      {/* Table rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex justify-between py-3 border-b border-gray-100">
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-4 bg-gray-200 rounded w-28" />
          <div className="h-4 bg-gray-200 rounded w-20" />
        </div>
      ))}

      <span className="sr-only">Loading table...</span>
    </div>
  );
}

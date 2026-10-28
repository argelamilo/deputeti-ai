/**
 * MetricCard Skeleton
 *
 * Loading placeholder for metric cards during SSR streaming
 * Shows while data is being fetched from the server
 */

export function MetricCardSkeleton() {
  return (
    <div
      className="bg-white rounded-lg p-6 shadow-sm border border-stroke animate-pulse"
      role="status"
      aria-label="Loading metric"
    >
      {/* Icon placeholder */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-lg" />
      </div>

      {/* Title placeholder */}
      <div className="mb-2">
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </div>

      {/* Value placeholder */}
      <div className="mb-1">
        <div className="h-8 bg-gray-300 rounded w-3/4" />
      </div>

      {/* Subtitle placeholder */}
      <div>
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>

      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * MetricCard Grid Skeleton
 *
 * Shows a grid of skeleton cards matching the dashboard layout
 */
export function MetricGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <MetricCardSkeleton key={i} />
      ))}
    </>
  );
}

interface MetricBadgeProps {
  badge: string;
}

export function MetricBadge({ badge }: MetricBadgeProps) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-lg text-xs text-gray-600 border border-gray-200 whitespace-nowrap">
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      {badge}
    </div>
  );
}

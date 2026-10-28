interface DashboardDescriptionProps {
  description: string;
}

export function DashboardDescription({ description }: DashboardDescriptionProps) {
  return (
    <p
      className="text-sm text-gray-600"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      {description}
    </p>
  );
}

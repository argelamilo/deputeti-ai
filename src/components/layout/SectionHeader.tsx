interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-3 gap-1 sm:gap-0">
      <h2
        className="text-base sm:text-lg font-semibold"
        style={{ fontFamily: "'Space Grotesk', sans-serif", color: "black" }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className="text-xs sm:text-sm text-gray-500"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

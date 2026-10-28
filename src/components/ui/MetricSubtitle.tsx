import { cn } from "@/lib/utils/cn";

interface MetricSubtitleProps {
  subtitle: string;
  size?: "small" | "medium" | "large";
}

export function MetricSubtitle({ subtitle, size = "large" }: MetricSubtitleProps) {
  const sizeConfig = {
    small: "text-xs",
    medium: "text-xs",
    large: "text-xs",
  };

  return (
    <div className="mt-2 pt-2 border-t border-gray-300">
      <p className={cn(sizeConfig[size] || sizeConfig.large, "text-gray-600")}>
        {subtitle}
      </p>
    </div>
  );
}

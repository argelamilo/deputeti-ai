import { cn } from "@/lib/utils/cn";

interface MetricValueProps {
  value: string | number;
  description?: string;
  size?: "small" | "medium" | "large";
}

export function MetricValue({ value, description, size = "large" }: MetricValueProps) {
  const sizeConfig = {
    small: {
      valueSize: "text-base",
      descSize: "text-xs",
    },
    medium: {
      valueSize: "text-xl",
      descSize: "text-xs",
    },
    large: {
      valueSize: "text-2xl",
      descSize: "text-xs",
    },
  };

  const config = sizeConfig[size] || sizeConfig.large;

  return (
    <div className="space-y-1 flex-grow">
      <h3 className={cn(config.valueSize, "font-semibold text-gray-900")}>
        {value}
      </h3>
      {description && (
        <p className={cn(config.descSize, "text-gray-500")}>
          {description}
        </p>
      )}
    </div>
  );
}

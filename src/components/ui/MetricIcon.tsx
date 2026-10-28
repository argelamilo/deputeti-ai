import { cn } from "@/lib/utils/cn";

interface MetricIconProps {
  icon: string | React.ReactNode;
  iconBgColor?: string;
  size?: "small" | "medium" | "large";
}

export function MetricIcon({ icon, iconBgColor = "#eff6ff", size = "large" }: MetricIconProps) {
  const sizeConfig = {
    small: "h-10 w-10",
    medium: "h-10 w-10",
    large: "h-10 w-10",
  };

  return (
    <div
      className={cn(
        sizeConfig[size] || sizeConfig.large,
        "rounded-lg flex items-center justify-center"
      )}
      style={{ backgroundColor: iconBgColor }}
    >
      {typeof icon === "string" ? (
        <span className="text-xl">{icon}</span>
      ) : (
        icon
      )}
    </div>
  );
}

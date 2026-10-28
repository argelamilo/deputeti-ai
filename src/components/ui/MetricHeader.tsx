import { cn } from "@/lib/utils/cn";
import { DateRangeSelector } from "./DateRangeSelector";

interface MetricHeaderProps {
  title: string;
  showDateSelector?: boolean;
  currentTimeRange?: string;
  onDateRangeChange?: (range: string) => void;
  onCustomRangeChange?: (start: Date, end: Date) => void;
  customRangeLabel?: string;
  customRangeValue?: {
    startDate: string;
    endDate: string;
  } | null;
  size?: "small" | "medium" | "large";
}

export function MetricHeader({
  title,
  showDateSelector,
  currentTimeRange,
  onDateRangeChange,
  onCustomRangeChange,
  customRangeLabel,
  customRangeValue,
  size = "large",
}: MetricHeaderProps) {
  const sizeConfig = {
    small: "text-xs",
    medium: "text-sm",
    large: "text-sm",
  };

  return (
    <div className="pb-3 flex items-center justify-between">
      <h4 className={cn(sizeConfig[size] || sizeConfig.large, "font-medium text-black")}>
        {title}
      </h4>
      {showDateSelector && (
        <DateRangeSelector
          value={currentTimeRange as any}
          onChange={(range) => onDateRangeChange?.(range)}
          onCustomRange={(start, end) => onCustomRangeChange?.(start, end)}
          customRangeLabel={customRangeLabel}
          customRangeValue={customRangeValue}
          className="scale-90 origin-right"
        />
      )}
    </div>
  );
}

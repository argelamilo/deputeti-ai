"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * DateRangeSelector Component
 * Matches EXACT styling from root frontend date range selector
 */

export type DateRangeOption =
  | "this_month"
  | "this_year"
  | "lifetime";

export interface DateRangeSelectorProps {
  value?: DateRangeOption;
  onChange?: (value: DateRangeOption) => void;
  onCustomRange?: (start: Date, end: Date) => void;
  customRangeLabel?: string;
  customRangeValue?: {
    startDate: string;
    endDate: string;
  } | null;
  className?: string;
}

const dateRangeLabels: Record<DateRangeOption, string> = {
  this_month: "This month",
  this_year: "This year",
  lifetime: "Lifetime",
};

export function DateRangeSelector({
  value = "this_month",
  onChange,
  onCustomRange,
  customRangeLabel,
  customRangeValue,
  className,
}: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<DateRangeOption>(value);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync local state with external value prop changes
  useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (option: DateRangeOption) => {
    setSelectedValue(option);
    setIsOpen(false);
    onChange?.(option);
  };

  const displayLabel = dateRangeLabels[selectedValue];

  return (
    <div className={cn("relative inline-block", className)} ref={dropdownRef}>
      {/* Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation(); // Prevent click from bubbling to parent card
          setIsOpen(!isOpen);
        }}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-md hover:border-gray-300 hover:shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all duration-150"
      >
        {/* Calendar Icon */}
        <svg
          className="h-3.5 w-3.5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>

        {/* Selected Value Text */}
        <span className="text-xs font-medium text-gray-700 truncate">{displayLabel}</span>

        {/* Dropdown Arrow */}
        <svg
          className={cn(
            "h-3.5 w-3.5 text-gray-400 transition-transform duration-150",
            isOpen && "rotate-180"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[200px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="py-1">
              {(Object.keys(dateRangeLabels) as DateRangeOption[]).map((option) => (
                <button
                  type="button"
                  key={option}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(option);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors",
                    selectedValue === option && "bg-blue-50 text-blue-700 font-medium"
                  )}
                >
                  {dateRangeLabels[option]}
                </button>
              ))}
            </div>
          </div>
          {/* Overlay to close dropdown */}
          <div
            className="fixed inset-0 z-40"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          />
        </>
      )}
    </div>
  );
}

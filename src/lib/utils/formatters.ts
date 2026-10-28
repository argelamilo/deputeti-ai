/**
 * Format a number as currency
 * @param value - The numeric value to format
 * @param currency - Currency code (default: USD)
 * @param locale - Locale for formatting (default: en-US)
 * @example formatCurrency(1234567.89) => "$1,234,567.89"
 */
export function formatCurrency(
  value: number,
  currency: string = "USD",
  locale: string = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a number as a percentage
 * @param value - The numeric value (0-100 or 0-1 based on isDecimal)
 * @param decimals - Number of decimal places
 * @param isDecimal - Whether input is decimal (0.76) or percentage (76)
 * @example formatPercentage(76.5, 1) => "76.5%"
 * @example formatPercentage(0.765, 1, true) => "76.5%"
 */
export function formatPercentage(
  value: number,
  decimals: number = 1,
  isDecimal: boolean = false
): string {
  const numericValue = isDecimal ? value * 100 : value;
  return `${numericValue.toFixed(decimals)}%`;
}

/**
 * Format a large number with compact notation
 * @param value - The numeric value to format
 * @param decimals - Number of decimal places
 * @example formatCompactNumber(1234567) => "1.2M"
 * @example formatCompactNumber(1234) => "1.2K"
 */
export function formatCompactNumber(value: number, decimals: number = 1): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (absValue >= 1_000_000_000) {
    return `${sign}${(absValue / 1_000_000_000).toFixed(decimals)}B`;
  } else if (absValue >= 1_000_000) {
    return `${sign}${(absValue / 1_000_000).toFixed(decimals)}M`;
  } else if (absValue >= 1_000) {
    return `${sign}${(absValue / 1_000).toFixed(decimals)}K`;
  }
  return `${sign}${absValue.toFixed(decimals)}`;
}

/**
 * Format a number with thousand separators
 * @param value - The numeric value to format
 * @param decimals - Number of decimal places
 * @param locale - Locale for formatting
 * @example formatNumber(1234567.89, 2) => "1,234,567.89"
 */
export function formatNumber(
  value: number,
  decimals: number = 0,
  locale: string = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a date string or Date object
 * @param date - Date string or Date object
 * @param format - Format style ("short", "medium", "long", "full")
 * @param locale - Locale for formatting
 * @example formatDate("2025-11-01") => "Nov 1, 2025"
 */
export function formatDate(
  date: string | Date,
  format: "short" | "medium" | "long" | "full" = "medium",
  locale: string = "en-US"
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
    short: { month: "short", day: "numeric", year: "numeric" },
    medium: { month: "short", day: "numeric", year: "numeric" },
    long: { month: "long", day: "numeric", year: "numeric" },
    full: { weekday: "long", month: "long", day: "numeric", year: "numeric" },
  };

  return new Intl.DateTimeFormat(locale, formatOptions[format]).format(dateObj);
}

/**
 * Format a relative time string (e.g., "2 days ago")
 * @param date - Date string or Date object
 * @param locale - Locale for formatting
 * @example formatRelativeTime("2025-10-30") => "2 days ago"
 */
export function formatRelativeTime(
  date: string | Date,
  locale: string = "en-US"
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (diffYear > 0) return rtf.format(-diffYear, "year");
  if (diffMonth > 0) return rtf.format(-diffMonth, "month");
  if (diffWeek > 0) return rtf.format(-diffWeek, "week");
  if (diffDay > 0) return rtf.format(-diffDay, "day");
  if (diffHour > 0) return rtf.format(-diffHour, "hour");
  if (diffMin > 0) return rtf.format(-diffMin, "minute");
  return rtf.format(-diffSec, "second");
}

/**
 * Calculate percentage change between two values
 * @param currentValue - Current value
 * @param previousValue - Previous value
 * @param decimals - Number of decimal places
 * @example calculatePercentageChange(120, 100) => "+20.0%"
 */
export function calculatePercentageChange(
  currentValue: number,
  previousValue: number,
  decimals: number = 1
): string {
  if (previousValue === 0) return "N/A";

  const change = ((currentValue - previousValue) / previousValue) * 100;
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(decimals)}%`;
}

/**
 * Format square footage
 * @param sqft - Square footage value
 * @example formatSqft(1500) => "1,500 sq ft"
 */
export function formatSqft(sqft: number): string {
  return `${formatNumber(sqft)} sq ft`;
}

/**
 * Truncate text to a maximum length
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @param ellipsis - Ellipsis string
 * @example truncateText("Long text here", 10) => "Long text..."
 */
export function truncateText(
  text: string,
  maxLength: number,
  ellipsis: string = "..."
): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * Formatting rules for metric values
 */
export interface FormattingRules {
  decimals?: number;
  prefix?: string;
  suffix?: string;
  currency?: string;
  abbreviate?: boolean;
  locale?: string;
}

/**
 * Format metric value based on display format and rules
 * Used by DynamicMetricWidget for consistent metric formatting
 *
 * @param value - Value to format
 * @param format - Display format type
 * @param rules - Optional formatting rules
 * @example formatMetricValue(1234567, 'currency') => "$1,234,567.00"
 * @example formatMetricValue(1234567, 'currency', { abbreviate: true }) => "$1.2M"
 */
export function formatMetricValue(
  value: any,
  format: string = 'number',
  rules?: FormattingRules
): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  const numValue = typeof value === 'number' ? value : Number(value);
  const decimals = rules?.decimals ?? 2;

  // Apply abbreviation if requested
  if (rules?.abbreviate && Math.abs(numValue) >= 1000) {
    const abbreviated = formatCompactNumber(numValue, decimals);
    return applyFormattingRules(abbreviated, rules);
  }

  let formatted: string;

  switch (format) {
    case 'currency':
      formatted = formatCurrency(numValue, rules?.currency || 'USD', rules?.locale || 'en-US');
      break;

    case 'percentage':
      formatted = formatPercentage(numValue, decimals);
      break;

    case 'decimal':
      formatted = numValue.toFixed(decimals);
      break;

    case 'integer':
      formatted = Math.round(numValue).toString();
      break;

    case 'number':
      formatted = formatNumber(numValue, decimals, rules?.locale || 'en-US');
      break;

    case 'date':
      formatted = formatDate(value, 'medium', rules?.locale || 'en-US');
      break;

    case 'datetime':
      const dateObj = typeof value === 'string' ? new Date(value) : value;
      formatted = new Intl.DateTimeFormat(rules?.locale || 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(dateObj);
      break;

    case 'text':
    default:
      formatted = String(value);
  }

  return applyFormattingRules(formatted, rules);
}

/**
 * Apply prefix/suffix formatting rules
 */
function applyFormattingRules(value: string, rules?: FormattingRules): string {
  let result = value;

  if (rules?.prefix) {
    result = rules.prefix + result;
  }
  if (rules?.suffix) {
    result = result + rules.suffix;
  }

  return result;
}

/**
 * LastUpdatedFooter Component
 * 
 * Displays when the dashboard data was last updated.
 * Configurable per tenant via display_preferences.show_last_updated setting.
 * 
 * Features:
 * - Shows relative time (e.g., "Updated 5 minutes ago")
 * - Auto-updates every minute
 * - Optional absolute timestamp on hover
 * - Subtle, non-intrusive design
 */

import React, { useState, useEffect } from 'react';

interface LastUpdatedFooterProps {
  /** Timestamp when data was last updated */
  lastUpdated?: Date | string;
  /** Display format: 'relative' (default), 'absolute', or 'day_month' */
  format?: 'relative' | 'absolute' | 'day_month';
  /** Custom CSS classes */
  className?: string;
}

/**
 * Format relative time (e.g., "5 minutes ago", "2 hours ago")
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return 'just now';
  } else if (diffMin < 60) {
    return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHour < 24) {
    return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDay < 7) {
    return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;
  } else {
    // For older dates, show absolute format
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}

/**
 * Format absolute time with date and time
 */
function getAbsoluteTime(date: Date): string {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format with day and month only (e.g., "Nov 25")
 */
function getDayMonthTime(date: Date): string {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function LastUpdatedFooter({
  lastUpdated,
  format = 'relative',
  className = '',
}: LastUpdatedFooterProps) {
  // Convert to Date object if needed
  const updateDate = lastUpdated
    ? lastUpdated instanceof Date
      ? lastUpdated
      : new Date(lastUpdated)
    : new Date(); // Default to now if not provided

  // State for auto-updating relative time
  const [displayTime, setDisplayTime] = useState<string>('');

  // Update displayed time
  useEffect(() => {
    const updateDisplayTime = () => {
      if (format === 'relative') {
        setDisplayTime(getRelativeTime(updateDate));
      } else if (format === 'day_month') {
        setDisplayTime(getDayMonthTime(updateDate));
      } else {
        setDisplayTime(getAbsoluteTime(updateDate));
      }
    };

    // Initial update
    updateDisplayTime();

    // Update every minute for relative time
    const interval = setInterval(() => {
      if (format === 'relative') {
        updateDisplayTime();
      }
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [updateDate, format]);

  const absoluteTime = getAbsoluteTime(updateDate);

  return (
    <div
      className={`text-center py-4 ${className}`}
      role="contentinfo"
      aria-label="Dashboard update information"
    >
      <span
        className="text-xs text-gray-500"
        title={format === 'relative' ? absoluteTime : undefined}
      >
        Last updated: {displayTime}
      </span>
    </div>
  );
}


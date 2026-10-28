"use client";

import React from 'react';

export interface StatusBadgeProps {
  /** The status key to look up from database (e.g., 'active', 'expired', 'expiring_soon') */
  statusKey: string;
  /** Optional context to filter status definitions (e.g., 'membership', 'payment') */
  context?: string;
  /** Optional children to override the default label */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * StatusBadge Component
 *
 * A simplified status badge component without tenant context dependency.
 * Provides basic styling for status display.
 */
export function StatusBadge({
  statusKey,
  context = 'membership',
  children,
  className = '',
}: StatusBadgeProps) {
  // Simple fallback rendering without tenant context
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 ${className}`}>
      {children || statusKey}
    </span>
  );
}

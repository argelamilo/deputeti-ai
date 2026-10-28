"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Download,
  X,
} from "lucide-react";

/**
 * Column Definition Interface
 */
export interface ColumnDef {
  /** Unique key matching data property */
  key: string;
  /** Display title for column header */
  title: string;
  /** Enable sorting for this column */
  sortable: boolean;
  /** Data type for formatting */
  type: "text" | "currency" | "percentage" | "date" | "number";
  /** Custom render function for cell content */
  render?: (value: any, row: any) => React.ReactNode;
}

/**
 * DataTable Props Interface
 */
export interface DataTableProps {
  /** Array of data objects to display */
  data: any[];
  /** Column definitions */
  columns: ColumnDef[];
  /** Optional table title */
  title?: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Enable pagination */
  pagination?: boolean;
  /** Rows per page (default: 10) */
  pageSize?: number;
  /** Enable search functionality */
  search?: boolean;
  /** Enable export to CSV */
  export?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * DataTable Component
 *
 * Reusable data table with sorting, pagination, search, and export functionality.
 * Follows the design patterns from the old frontend but modernized for app-2.0.
 *
 * Features:
 * - Column sorting (ascending/descending)
 * - Pagination with configurable page size
 * - Search across all columns
 * - Export to CSV
 * - Type-aware formatting (currency, percentage, date, number)
 * - Responsive design
 * - Loading and empty states
 *
 * @example
 * ```tsx
 * <DataTable
 *   data={members}
 *   columns={[
 *     { key: 'name', title: 'Name', sortable: true, type: 'text' },
 *     { key: 'mrr', title: 'MRR', sortable: true, type: 'currency' }
 *   ]}
 *   title="Member List"
 *   pagination={true}
 *   search={true}
 *   export={true}
 * />
 * ```
 */
export function DataTable({
  data = [],
  columns = [],
  title,
  subtitle,
  pagination = true,
  pageSize = 10,
  search = true,
  export: showExport = false,
  loading = false,
  emptyMessage = "No data available",
  className = "",
}: DataTableProps) {
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  // Infinite scroll state
  const [displayedRows, setDisplayedRows] = useState(pageSize);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Reset to page 1 when search term changes
  useEffect(() => {
    const timer = setTimeout(() => setCurrentPage(1), 0);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Infinite scroll: Reset displayed rows when data changes
  useEffect(() => {
    if (!pagination) {
      const timer = setTimeout(() => setDisplayedRows(pageSize), 0);
      return () => clearTimeout(timer);
    }
  }, [data, pagination, pageSize]);

  // Infinite scroll: Intersection Observer
  useEffect(() => {
    if (!pagination && loadMoreRef.current && scrollContainerRef.current) {
      const currentRef = loadMoreRef.current;
      const scrollContainer = scrollContainerRef.current;
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setDisplayedRows((prev) => prev + pageSize);
          }
        },
        {
          root: scrollContainer,
          threshold: 0.1
        }
      );

      observer.observe(currentRef);

      return () => {
        if (currentRef) {
          observer.unobserve(currentRef);
        }
      };
    }
  }, [pagination, pageSize]);

  /**
   * Format value based on column type
   */
  const formatValue = (value: any, type: ColumnDef["type"]): string => {
    if (value === null || value === undefined) return "-";

    switch (type) {
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(Number(value) || 0);

      case "percentage":
        return `${(Number(value) || 0).toFixed(1)}%`;

      case "number":
        return new Intl.NumberFormat("en-US").format(Number(value) || 0);

      case "date":
        try {
          return new Date(value).toLocaleDateString("en-US");
        } catch {
          return String(value);
        }

      case "text":
      default:
        return String(value);
    }
  };

  /**
   * Filter data based on search term
   */
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;

    const lowerSearch = searchTerm.toLowerCase();
    return data.filter((row) => {
      return columns.some((col) => {
        const value = row[col.key];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(lowerSearch);
      });
    });
  }, [data, searchTerm, columns]);

  /**
   * Sort filtered data
   */
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    const sorted = [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      // Handle null/undefined
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      // Numeric comparison
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      // String comparison
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      if (aStr < bStr) return sortConfig.direction === "asc" ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredData, sortConfig]);

  /**
   * Paginate sorted data or slice for infinite scroll
   */
  const paginatedData = useMemo(() => {
    if (!pagination) {
      // Infinite scroll: show first N rows
      return sortedData.slice(0, displayedRows);
    }

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, pageSize, pagination, displayedRows]);

  /**
   * Handle sort column click
   */
  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (!prev || prev.key !== key) {
        return { key, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { key, direction: "desc" };
      }
      return null; // Remove sort
    });
  };

  /**
   * Export data to CSV
   */
  const handleExport = () => {
    // Use all filtered data (not just current page)
    const csvData = sortedData;

    // Build CSV header
    const headers = columns.map((col) => col.title).join(",");

    // Build CSV rows
    const rows = csvData
      .map((row) => {
        return columns
          .map((col) => {
            const value = col.render
              ? String(col.render(row[col.key], row))
                  .replace(/<[^>]*>/g, "")
                  .trim()
              : formatValue(row[col.key], col.type);

            // Escape quotes and wrap in quotes if contains comma
            const escaped = String(value).replace(/"/g, '""');
            return escaped.includes(",") ? `"${escaped}"` : escaped;
          })
          .join(",");
      })
      .join("\n");

    const csv = `${headers}\n${rows}`;

    // Download CSV file
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${title?.toLowerCase().replace(/\s+/g, "-") || "data"}-${Date.now()}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Render sort icon
   */
  const renderSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ArrowUpDown className="ml-1 h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="ml-1 h-4 w-4 text-gray-700" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4 text-gray-700" />
    );
  };

  /**
   * Loading State
   */
  if (loading) {
    return (
      <div className={`bg-white p-6 ${className}`}>
        {title && (
          <div className="mb-4 h-6 w-48 animate-pulse rounded bg-gray-200"></div>
        )}
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-gray-100"></div>
          ))}
        </div>
      </div>
    );
  }

  /**
   * Empty State
   */
  if (!data || data.length === 0) {
    return (
      <div className={`bg-white p-6 ${className}`}>
        {title && (
          <h3
            className="mb-2 font-semibold"
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "#212121",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            {title}
          </h3>
        )}
        <div className="py-12 text-center">
          <p style={{ color: "#757575" }}>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white flex flex-col h-full rounded-lg overflow-hidden ${className}`}>
      {/* Header with Title and Export */}
      {(title || subtitle || showExport) && (
        <div
          className="flex items-center justify-between bg-white p-4"
          style={{ borderBottom: "1px solid #e0e0e0" }}
        >
          <div>
            {title && (
              <h3
                className="font-semibold"
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "#212121",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                {title}
              </h3>
            )}
            {subtitle && <p className="mt-1 text-sm" style={{ color: "#757575" }}>{subtitle}</p>}
          </div>
          {/* Export Button */}
          {showExport && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          )}
        </div>
      )}

      {/* Search */}
      {search && (
        <div className="px-6 py-4" style={{ borderBottom: "1px solid #e0e0e0" }}>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border py-2 pl-10 pr-10 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
              style={{ borderColor: "#d1d5db" }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table with Scrollable Body */}
      <div
        ref={scrollContainerRef}
        className="overflow-auto flex-1"
      >
        <table className="w-full border-collapse">
          <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
            <tr style={{ backgroundColor: "#ffffff", borderBottom: "2px solid #e0e0e0" }}>
              {/* Row Number Column */}
              <th
                className="px-4 py-3 text-left font-medium"
                style={{
                  fontSize: "0.875rem",
                  color: "#424242",
                  borderRight: "1px solid #f0f0f0",
                  fontWeight: 600,
                  backgroundColor: "#ffffff"
                }}
              >
                #
              </th>
              {columns.map((column, colIndex) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left font-medium ${
                    column.sortable ? "cursor-pointer select-none hover:bg-gray-100" : ""
                  }`}
                  onClick={() => column.sortable && handleSort(column.key)}
                  style={{
                    fontSize: "0.875rem",
                    color: "#424242",
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 600,
                    borderRight: colIndex < columns.length - 1 ? "1px solid #f0f0f0" : "none",
                    backgroundColor: "#ffffff"
                  }}
                >
                  <div className="flex items-center">
                    {column.title}
                    {column.sortable && renderSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {paginatedData.map((row, rowIndex) => {
              const actualRowNumber = (currentPage - 1) * pageSize + rowIndex + 1;
              return (
                <tr
                  key={rowIndex}
                  style={{
                    backgroundColor: rowIndex % 2 === 0 ? "#ffffff" : "#fafafa",
                    transition: "background-color 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f5f5f5";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = rowIndex % 2 === 0 ? "#ffffff" : "#fafafa";
                  }}
                >
                  {/* Row Number Cell */}
                  <td
                    className="p-3 text-sm"
                    style={{
                      color: "#6b7280",
                      borderBottom: "1px solid #f0f0f0",
                      borderRight: "1px solid #f0f0f0",
                      fontWeight: 500
                    }}
                  >
                    {actualRowNumber}
                  </td>
                  {columns.map((column, cellIndex) => (
                    <td
                      key={`${rowIndex}-${column.key}`}
                      className="p-3 text-sm"
                      style={{
                        color: "#424242",
                        borderBottom: "1px solid #f0f0f0",
                        borderRight: cellIndex < columns.length - 1 ? "1px solid #f0f0f0" : "none"
                      }}
                    >
                      {column.render
                        ? column.render(row[column.key], row)
                        : formatValue(row[column.key], column.type)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Infinite Scroll Trigger */}
        {!pagination && displayedRows < sortedData.length && (
          <div
            ref={loadMoreRef}
            className="flex items-center justify-center py-4"
            style={{ borderTop: "1px solid #e0e0e0", backgroundColor: "#fafafa" }}
          >
            <div className="text-sm" style={{ color: "#757575" }}>
              Loading more...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

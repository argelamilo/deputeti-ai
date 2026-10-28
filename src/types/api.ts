/**
 * API Type Definitions
 * Type system for API requests and responses
 */

/**
 * API Response - Standard API response wrapper
 */
export interface APIResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  error?: APIError;
  metadata?: ResponseMetadata;
}

/**
 * API Error - Error structure
 */
export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  field?: string;
  timestamp: string;
}

/**
 * Response Metadata - Additional response information
 */
export interface ResponseMetadata {
  total_count?: number;
  page?: number;
  page_size?: number;
  total_pages?: number;
  has_more?: boolean;
  execution_time_ms?: number;
  cached?: boolean;
  cache_expires_at?: string;
}

/**
 * Pagination Parameters
 */
export interface PaginationParams {
  page?: number;
  page_size?: number;
  offset?: number;
  limit?: number;
}

/**
 * Sort Parameters
 */
export interface SortParams {
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

/**
 * Query Parameters - Generic query params
 */
export interface QueryParams extends PaginationParams, SortParams {
  filters?: Record<string, unknown>;
  search?: string;
  fields?: string[];
  expand?: string[];
}

/**
 * API Client Configuration
 */
export interface APIClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  withCredentials?: boolean;
}

/**
 * Authentication Token
 */
export interface AuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

/**
 * Request Options
 */
export interface RequestOptions {
  headers?: Record<string, string>;
  params?: QueryParams;
  signal?: AbortSignal;
  cache?: RequestCache;
}

/**
 * Common Type Definitions
 * Shared utility types used across the application
 */

/**
 * Pagination parameters for list queries
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort parameters
 */
export interface SortParams {
  field: string;
  direction: SortDirection;
}

/**
 * Combined query parameters for paginated and sorted lists
 */
export interface ListQueryParams extends Partial<PaginationParams>, Partial<SortParams> {
  search?: string;
}

/**
 * Standard API success response
 */
export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Paginated API response
 */
export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  details?: Record<string, string[]>;
}

/**
 * Combined API response type
 */
export type ApiResult<T> = ApiResponse<T> | ApiErrorResponse;

/**
 * ID parameter (commonly used in routes)
 */
export interface IdParam {
  id: string | number;
}

/**
 * Timestamps for database records
 */
export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Base entity with ID and timestamps
 */
export interface BaseEntity extends Timestamps {
  id: number;
}

/**
 * Soft delete fields
 */
export interface SoftDeletable {
  deletedAt: Date | null;
  isDeleted: boolean;
}

/**
 * Make all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Make specific properties required
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Make specific properties optional
 */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Extract non-nullable type
 */
export type NonNullableFields<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

/**
 * Create type for creating new entity (without id and timestamps)
 */
export type CreateInput<T extends BaseEntity> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Create type for updating entity (all fields optional except what's specified)
 */
export type UpdateInput<T extends BaseEntity> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * JSON value types
 */
export type JsonPrimitive = string | number | boolean | null;
export type JsonArray = JsonValue[];
export type JsonObject = { [key: string]: JsonValue };
export type JsonValue = JsonPrimitive | JsonArray | JsonObject;

/**
 * Record with string keys and number values (used for inventory, stats, etc.)
 */
export type NumberRecord = Record<string, number>;

/**
 * Record with string keys and boolean values (used for settings, flags, etc.)
 */
export type BooleanRecord = Record<string, boolean>;

/**
 * Range type for min/max values
 */
export interface Range {
  min: number;
  max: number;
}

/**
 * Date range for queries
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Result of a batch operation
 */
export interface BatchResult<T> {
  succeeded: T[];
  failed: Array<{
    item: T;
    error: string;
  }>;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
}

/**
 * Validation error format
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Event callback type
 */
export type EventCallback<T = unknown> = (data: T) => void | Promise<void>;

/**
 * Async function type
 */
export type AsyncFunction<T = unknown, R = void> = (arg: T) => Promise<R>;

/**
 * Constructor type
 */
export type Constructor<T = object> = new (...args: unknown[]) => T;

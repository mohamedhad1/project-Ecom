/**
 * src/utils/ApiResponse.ts
 *
 * Consistent API response shape used across all endpoints.
 *
 * Success:  { success: true,  data: T,       message?: string }
 * Error:    { success: false, message: string }
 * Paginated:{ success: true,  data: T[],     pagination: {...} }
 */

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export function successResponse<T> (data: T, message?: string) {
  return {
    success: true as const,
    ...(message !== undefined && { message }),
    data,
  }
}

export function paginatedResponse<T> (
  data: T[],
  pagination: PaginationMeta,
  message?: string,
) {
  return {
    success: true as const,
    ...(message !== undefined && { message }),
    data,
    pagination,
  }
}

export function errorResponse (message: string) {
  return {
    success: false as const,
    message,
  }
}

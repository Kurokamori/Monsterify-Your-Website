import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { config } from '../config/index.js';

// ============================================================================
// Axios instance
// ============================================================================

const client: AxiosInstance = axios.create({
  baseURL: config.api.baseUrl,
  timeout: config.api.timeout,
  headers: { 'Content-Type': 'application/json' },
});

// Attach bot token to every request
client.interceptors.request.use((cfg) => {
  if (config.api.botSecret) {
    cfg.headers['X-Bot-Token'] = config.api.botSecret;
  }
  return cfg;
});

// ============================================================================
// Auth helpers
// ============================================================================

/**
 * Returns headers that authenticate a request as a specific Discord user.
 * Combine with other AxiosRequestConfig via spread:
 *
 * ```ts
 * api.post('/trainers/add-levels', body, withAuth(discordId));
 * ```
 */
export function withAuth(discordId: string): AxiosRequestConfig {
  return { headers: { 'X-Discord-Id': discordId } };
}

// ============================================================================
// Typed request helpers
// ============================================================================

/**
 * All backend responses share this envelope. Individual endpoints add extra
 * top-level keys (`trainer`, `monsters`, `user`, etc.) which callers extract.
 */
export interface BaseResponse {
  success: boolean;
  message?: string;
}

export async function get<T extends BaseResponse>(
  url: string,
  cfg?: AxiosRequestConfig,
): Promise<T> {
  const response = await client.get<T>(url, cfg);
  return response.data;
}

export async function post<T extends BaseResponse>(
  url: string,
  data?: unknown,
  cfg?: AxiosRequestConfig,
): Promise<T> {
  const response = await client.post<T>(url, data, cfg);
  return response.data;
}

export async function put<T extends BaseResponse>(
  url: string,
  data?: unknown,
  cfg?: AxiosRequestConfig,
): Promise<T> {
  const response = await client.put<T>(url, data, cfg);
  return response.data;
}

export async function del<T extends BaseResponse>(
  url: string,
  cfg?: AxiosRequestConfig,
): Promise<T> {
  const response = await client.delete<T>(url, cfg);
  return response.data;
}

// ============================================================================
// Re-export the raw instance for edge cases
// ============================================================================

export { client };

import { baseService } from '@/services/api/baseService';

import type { AxiosRequestConfig } from 'axios';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T;
  pagination: PaginationMeta;
}

/**
 * Wrapper around baseService that auto-unwraps response.data.data.
 * Use for standard JSON requests. Use baseService directly for FormData.
 * Use getPaginated for list endpoints that return a { data, pagination } envelope.
 */
export const apiService = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await baseService.get(url, config);
    return response.data?.data;
  },

  getPaginated: async <T>(url: string, config?: AxiosRequestConfig): Promise<Paginated<T>> => {
    const response = await baseService.get(url, config);
    const body = response.data ?? {};
    const pagination = body.pagination ?? {};
    const limit = pagination.limit ?? pagination.page_size ?? 0;
    const total = pagination.total ?? 0;
    const rawData = body.data;
    const items = Array.isArray(rawData) ? rawData : (rawData?.items ?? []);
    return {
      data: items,
      pagination: {
        page: pagination.page ?? 1,
        limit,
        total,
        totalPages: pagination.totalPages ?? (limit > 0 ? Math.ceil(total / limit) : 1),
      },
    };
  },

  post: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await baseService.post(url, data, config);
    return response.data?.data;
  },

  put: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await baseService.put(url, data, config);
    return response.data?.data;
  },

  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await baseService.delete(url, config);
    return response.data?.data;
  },
};

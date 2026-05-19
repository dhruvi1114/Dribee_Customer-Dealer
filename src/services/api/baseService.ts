import axios from 'axios';

import { env } from '@/config/env';
import { getToken, removeToken } from '@/lib/keychain';
import { logger } from '@/lib/logger';
import { API_BASE_URL } from '@/utils/constants/api.constant';

import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

const baseService = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'x-tenant-host': `${env.ORG_SLUG}.dribee.com`,
  },
});

// Paths where we auto-append the resolved warehouse_id so pricing and stock
// reflect the user's current location. Require-loaded lazily to avoid a
// circular dependency with the redux store.
const WAREHOUSE_AWARE_PATH_PREFIXES = ['/catalogue/', '/service/catalogue'];

const getWarehouseIdFromStore = (): number | null => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { store } = require('@/store/storeSetup') as typeof import('@/store/storeSetup');
    const state = store.getState() as { location?: { warehouseId: number | null } };
    return state.location?.warehouseId ?? null;
  } catch {
    return null;
  }
};

// Request interceptor — attach auth token, warehouse_id on GETs, log.
baseService.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const url = config.url ?? '';
    const method = config.method?.toLowerCase();
    if (
      method === 'get' &&
      WAREHOUSE_AWARE_PATH_PREFIXES.some((p) => url.startsWith(p))
    ) {
      const warehouseId = getWarehouseIdFromStore();
      if (warehouseId !== null) {
        config.params = {
          ...(config.params as Record<string, unknown> | undefined),
          warehouse_id: warehouseId,
        };
      }
    }

    logger.info(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data ?? '');
    return config;
  },
  (error: AxiosError) => {
    logger.error('[API] Request error', error.message);
    return Promise.reject(error);
  },
);

// Response interceptor — handle 401 + log
baseService.interceptors.response.use(
  (response) => {
    logger.info(`[API] ${response.status} ${response.config.url}`);
    return response;
  },
  async (error: AxiosError) => {
    const status = error.response?.status;
    const url = error.config?.url ?? '';
    const isExpected404 = status === 404 && /\/invoice$/.test(url);
    if (!isExpected404) {
      logger.error(`[API] ${status ?? 'Network'} error on ${url}`, error.response?.data ?? error.message);
    }
    if (status === 401) {
      logger.warn('[API] Unauthorized — clearing token and signing out');
      await removeToken();
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { store } = require('@/store/storeSetup') as typeof import('@/store/storeSetup');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { logout } = require('@/store/slices/authSlice') as typeof import('@/store/slices/authSlice');
        store.dispatch(logout());
      } catch (dispatchError) {
        logger.error('[API] Failed to dispatch logout', dispatchError);
      }
    }
    return Promise.reject(error);
  },
);

export { baseService };

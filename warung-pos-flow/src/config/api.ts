/**
 * API Configuration
 * Centralized API settings untuk semua modules
 */

const resolveBaseUrl = () => {
  const explicit = import.meta.env.VITE_API_BASE_URL;
  if (explicit) return explicit;

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    const port = import.meta.env.VITE_API_PORT ?? '3000';
    const normalizedPort = port === '' ? '' : `:${port}`;
    return `${protocol}//${hostname}${normalizedPort}`;
  }

  return 'http://127.0.0.1:3000';
};

const normalizeUrl = (url: string) => (url.endsWith('/') ? url.slice(0, -1) : url);

export const API_CONFIG = {
  BASE_URL: normalizeUrl(resolveBaseUrl()),
  TIMEOUT: 30000, // 30 seconds
  HEADERS: {
    'Content-Type': 'application/json',
  },
} as const;

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  PRODUCTS: '/products',
  CATEGORIES: '/categories',
  TRANSACTIONS: '/transactions',
  SYNC_FULL: '/sync/full',
  SYNC_UPLOAD: '/sync/upload',
  SYNC_STOCK: '/sync/stock',
} as const;

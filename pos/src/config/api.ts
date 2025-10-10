export const API_CONFIG = {
  BASE_URL: "local",
  TIMEOUT: 30000,
  HEADERS: {
    "Content-Type": "application/json",
  },
} as const;

export const API_ENDPOINTS = {
  PRODUCTS: "/products",
  CATEGORIES: "/categories",
  TRANSACTIONS: "/transactions",
} as const;

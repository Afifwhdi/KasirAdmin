export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://154.19.37.167:3000",
};

export const API_ENDPOINTS = {
  PRODUCTS: "/products",
  CATEGORIES: "/categories",
  TRANSACTIONS: "/transactions",
  SETTINGS: "/settings",
  AUTH_LOGIN: "/auth/login",
  AUTH_VERIFY: "/auth/verify",
};

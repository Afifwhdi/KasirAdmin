import { API_CONFIG, API_ENDPOINTS } from "@/config/api";
import { authService } from "./auth-service";

const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const authHeaders = authService.getAuthHeader();

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...options.headers,
    },
  });

  if (response.status === 401) {
    authService.logout();
    window.location.href = "/login";
    throw new Error("Session expired. Please login again.");
  }

  return response;
};

export const api = {
  products: {
    getAll: async () => {
      const res = await authenticatedFetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.PRODUCTS}`);
      if (!res.ok) throw new Error("Gagal memuat produk");
      const json = await res.json();
      return json.data ?? [];
    },
  },

  categories: {
    getAll: async () => {
      const res = await authenticatedFetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.CATEGORIES}`);
      if (!res.ok) throw new Error("Gagal memuat kategori");
      const json = await res.json();
      return json.data ?? [];
    },
  },

  transactions: {
    getAll: async () => {
      const res = await authenticatedFetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.TRANSACTIONS}`);
      if (!res.ok) throw new Error("Gagal memuat transaksi");
      const json = await res.json();
      return json.data ?? [];
    },
  },
};

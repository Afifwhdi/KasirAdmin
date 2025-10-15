import { API_CONFIG, API_ENDPOINTS } from "@/config/api";

export const api = {
  products: {
    getAll: async () => {
      const res = await fetch(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.PRODUCTS}`
      );
      if (!res.ok) throw new Error("Gagal memuat produk");
      const json = await res.json();
      return json.data ?? [];
    },
  },

  categories: {
    getAll: async () => {
      const res = await fetch(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.CATEGORIES}`
      );
      if (!res.ok) throw new Error("Gagal memuat kategori");
      const json = await res.json();
      return json.data ?? [];
    },
  },

  transactions: {
    getAll: async () => {
      const res = await fetch(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.TRANSACTIONS}`
      );
      if (!res.ok) throw new Error("Gagal memuat transaksi");
      const json = await res.json();
      return json.data ?? [];
    },
  },
};

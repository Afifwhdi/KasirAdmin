import { API_CONFIG, API_ENDPOINTS } from "@/config/api";

export const categoriesApi = {
  async getAll() {
    const res = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.CATEGORIES}`);
    if (!res.ok) throw new Error("Gagal memuat kategori");
    const json = await res.json();
    return json.data ?? [];
  },
};

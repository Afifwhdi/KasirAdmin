import { API_CONFIG, API_ENDPOINTS } from "@/config/api";
import { categoryService, isElectron } from "@/services/electron-db";

export const categoriesApi = {
  async getAll() {
    if (isElectron()) {
      try {
        const categories = await categoryService.getAll();
        
        if (categories && categories.length > 0) {
          return categories.map((c: any) => ({
            id: c.id,
            uuid: c.uuid,
            name: c.name,
          }));
        }
        
        console.warn("⚠️ Categories kosong, fetching from server...");
      } catch (dbError) {
        console.error("❌ Categories SQLite error:", dbError);
      }
    }

    const res = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.CATEGORIES}`);
    if (!res.ok) throw new Error("Gagal memuat kategori");
    const json = await res.json();
    return json.data ?? [];
  },
};

import { API_CONFIG, API_ENDPOINTS } from "@/config/api";
import { productService, isElectron } from "@/services/electron-db";

export interface ProductsPaginationParams {
  page?: number;
  limit?: number;
  category_id?: number;
  search?: string;
}

export interface ProductsPaginationResponse {
  status: string;
  message: string;
  data: Record<string, unknown>[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const productsApi = {
  async getAll(params?: ProductsPaginationParams): Promise<ProductsPaginationResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.category_id) queryParams.append("category_id", params.category_id.toString());
    if (params?.search) queryParams.append("search", params.search);

    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.PRODUCTS}${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    try {
      console.log("🌐 Fetching products from API:", url);
      const res = await fetch(url);
      if (!res.ok) throw new Error("Gagal memuat produk");
      const data = await res.json();
      console.log("✅ API fetch success:", data.meta);
      return data;
    } catch (error) {
      // OFFLINE FALLBACK: Load from local SQLite
      if (isElectron()) {
        console.log("⚠️ API fetch failed, loading from local database...");
        
        try {
          const limit = params?.limit || 1000;
          const page = params?.page || 1;
          const offset = (page - 1) * limit;
          
          // Build filter params for SQLite
          const filterParams: any = {
            limit,
            offset,
          };
          
          // Add category filter if needed
          if (params?.category_id) {
            filterParams.category = params.category_id.toString();
            console.log(`🔍 Filtering by category: ${filterParams.category}`);
          }
          
          // Add search filter if needed
          if (params?.search) {
            filterParams.search = params.search;
            console.log(`🔍 Searching for: ${params.search}`);
          }
          
          console.log(`🔍 Loading products from SQLite with filters:`, filterParams);
          
          // Use new method with filters applied in SQL query
          const products = await productService.getAllWithFilters(filterParams);
          const totalCount = await productService.countWithFilters({
            category: filterParams.category,
            search: filterParams.search,
          });
          
          console.log(`✅ Loaded ${products.length} products from local DB (total matching filters: ${totalCount})`);
          
          return {
            status: "success",
            message: "Data loaded from local database (offline mode)",
            data: products,
            meta: {
              total: totalCount,
              page: page,
              limit: limit,
              totalPages: Math.ceil(totalCount / limit),
            },
          };
        } catch (dbError) {
          console.error("❌ Failed to load from local database:", dbError);
          throw new Error("Gagal memuat produk: offline dan database lokal tidak tersedia");
        }
      }
      
      console.error("❌ Not in Electron environment, cannot use offline mode");
      throw error;
    }
  },
};

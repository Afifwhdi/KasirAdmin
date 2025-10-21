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
          
          console.log(`🔍 Loading products from SQLite (limit: ${limit}, offset: ${offset})...`);
          const products = await productService.getAll(limit, offset);
          const totalCount = await productService.count();
          
          console.log(`✅ Loaded ${products.length} products from local DB (total: ${totalCount})`);
          
          // Filter by category if needed
          let filteredProducts = products;
          if (params?.category_id) {
            // SQLite stores category as string (category_id.toString())
            filteredProducts = products.filter((p: any) => {
              const categoryId = p.category ? parseInt(p.category, 10) : null;
              return categoryId === params.category_id;
            });
            console.log(`🔍 Filtered by category ${params.category_id}: ${filteredProducts.length} products`);
          }
          
          // Filter by search if needed
          if (params?.search) {
            const searchLower = params.search.toLowerCase();
            filteredProducts = filteredProducts.filter((p: any) => 
              p.name?.toLowerCase().includes(searchLower) || 
              p.barcode?.toLowerCase().includes(searchLower)
            );
          }
          
          // Map products to include uuid field
          const mappedProducts = filteredProducts.map((p: any) => ({
            ...p,
            id: p.id,
            uuid: p.uuid, // Include server's UUID for sync compatibility
          }));
          
          return {
            status: "success",
            message: "Data loaded from local database (offline mode)",
            data: mappedProducts,
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

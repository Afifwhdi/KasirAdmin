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
    if (isElectron()) {
      const limit = params?.limit || 1000;
      const page = params?.page || 1;
      const offset = (page - 1) * limit;

      const filterParams: any = {
        limit,
        offset,
      };

      if (params?.category_id) {
        filterParams.category = params.category_id.toString();
      }

      if (params?.search) {
        filterParams.search = params.search;
      }

      try {
        const products = await productService.getAllWithFilters(filterParams);
        const totalCount = await productService.countWithFilters({
          category: filterParams.category,
          search: filterParams.search,
        });

        return {
          status: "success",
          message: totalCount > 0 
            ? `${totalCount} produk ditemukan` 
            : "Tidak ada produk di kategori ini",
          data: products as Record<string, unknown>[],
          meta: {
            total: totalCount,
            page: page,
            limit: limit,
            totalPages: Math.ceil(totalCount / limit) || 0,
          },
        };
      } catch (dbError) {
        console.error("❌ SQLite error:", dbError);
        return {
          status: "error",
          message: "Database error",
          data: [],
          meta: {
            total: 0,
            page: page,
            limit: limit,
            totalPages: 0,
          },
        };
      }
    }

    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.category_id) queryParams.append("category_id", params.category_id.toString());
    if (params?.search) queryParams.append("search", params.search);

    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.PRODUCTS}${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("Gagal memuat produk");
    return res.json();
  },
};

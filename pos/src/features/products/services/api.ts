import { API_CONFIG, API_ENDPOINTS } from "@/config/api";

export interface ProductsPaginationParams {
  page?: number;
  limit?: number;
  category_id?: number;
  search?: string;
}

export interface ProductsPaginationResponse {
  status: string;
  message: string;
  data: any[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const productsApi = {
  async getAll(
    params?: ProductsPaginationParams
  ): Promise<ProductsPaginationResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.category_id)
      queryParams.append("category_id", params.category_id.toString());
    if (params?.search) queryParams.append("search", params.search);

    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.PRODUCTS}${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("Gagal memuat produk");
    return res.json();
  },
};

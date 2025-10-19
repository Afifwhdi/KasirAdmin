import { isElectron, productService as electronProductService } from "./electron-db";
import {
  productsApi,
  ProductsPaginationParams,
  ProductsPaginationResponse,
} from "@/features/products/services/api";

// Wrapper service yang bisa pakai Electron DB atau API
export const productsWrapper = {
  async getAll(params?: ProductsPaginationParams): Promise<ProductsPaginationResponse> {
    if (isElectron()) {
      // Mode Electron: pakai SQLite
      const products = await electronProductService.getAll();

      // Filter & pagination manual
      let filtered = products;

      if (params?.search) {
        const search = params.search.toLowerCase();
        filtered = (products as Record<string, unknown>[]).filter(
          (p) => {
            const name = String(p.name || '').toLowerCase();
            const barcode = String(p.barcode || '').toLowerCase();
            return name.includes(search) || barcode.includes(search);
          }
        );
      }

      if (params?.category_id) {
        filtered = filtered.filter((p) => String(p.category) === params.category_id?.toString());
      }

      // Pagination
      const page = params?.page || 1;
      const limit = params?.limit || 50;
      const total = filtered.length;
      const totalPages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginated = filtered.slice(start, end);

      return {
        status: "success",
        message: "Products loaded from local database",
        data: paginated,
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } else {
      // Mode Browser: pakai API
      return productsApi.getAll(params);
    }
  },

  async search(query: string) {
    if (isElectron()) {
      return electronProductService.search(query);
    } else {
      const result = await productsApi.getAll({ search: query, limit: 100 });
      return result.data;
    }
  },

  async getByBarcode(barcode: string) {
    if (isElectron()) {
      return electronProductService.getByBarcode(barcode);
    } else {
      const result = await productsApi.getAll({ search: barcode, limit: 1 });
      return result.data[0] || null;
    }
  },
};

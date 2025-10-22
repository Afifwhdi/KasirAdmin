import { useQuery } from "@tanstack/react-query";
import { productService, categoryService } from "@/services/electron-db";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  barcode: string;
  is_plu_enabled: boolean;
  category: {
    id: number;
    name: string;
  } | null;
}

interface Category {
  id: number;
  name: string;
}

interface Settings {
  name: string;
  address: string;
  phone: string;
  logo: string;
  print_via_bluetooth: boolean;
  name_printer_local: string;
}

interface BootstrapData {
  products: Product[];
  categories: Category[];
  settings: Settings | null;
}

interface BootstrapResponse {
  status: string;
  message: string;
  data: BootstrapData;
  meta: {
    products_count: number;
    categories_count: number;
    timestamp: string;
  };
}

export function useBootstrap() {
  return useQuery<BootstrapData>({
    queryKey: ["bootstrap"],
    queryFn: async () => {

      const isElectron = typeof window !== "undefined" && window.electronAPI?.isElectron;
      

      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const token = localStorage.getItem("token");

        const response = await fetch(`${apiUrl}/bootstrap`, {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch bootstrap data");
        }

        const result: BootstrapResponse = await response.json();

        if (result.status !== "success") {
          throw new Error(result.message || "Bootstrap failed");
        }

        return result.data;
      } catch (error) {

        if (isElectron) {

          
          try {

            const products = await productService.getAll(1000, 0);
            const categories = await categoryService.getAll();
            


            
            const mappedData = {
              products: products.map((p: any) => ({
                id: p.id,
                uuid: p.uuid, // Include server's UUID for sync compatibility
                name: p.name,
                price: p.price,
                stock: p.stock,
                barcode: p.barcode,
                is_plu_enabled: p.is_plu_enabled || false,
                category: p.category ? {
                  id: p.category_id || null,
                  name: p.category
                } : null
              })),
              categories: categories.map((c: any) => ({
                id: c.id,
                name: c.name
              })),
              settings: null
            };
            

            return mappedData;
          } catch (dbError) {
            console.error("❌ Failed to load from local database:", dbError);
            console.error("Error details:", dbError.message, dbError.stack);
            throw new Error("Failed to load data: offline and no local data available");
          }
        }
        
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const token = localStorage.getItem("token");

      const response = await fetch(`${apiUrl}/products`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const result = await response.json();
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const token = localStorage.getItem("token");

      const response = await fetch(`${apiUrl}/categories`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      const result = await response.json();
      return result.data;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
}

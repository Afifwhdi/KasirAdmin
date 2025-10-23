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
  const isElectron = typeof window !== "undefined" && window.electronAPI?.isElectron;
  
  return useQuery<BootstrapData>({
    queryKey: ["bootstrap"],
    queryFn: async () => {
      if (isElectron) {
        try {
          const products = await productService.getAll(1000, 0);
          const categories = await categoryService.getAll();

          return {
            products: products.map((p: any) => ({
              id: p.id,
              uuid: p.uuid,
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
        } catch (dbError) {
          console.error("❌ Bootstrap SQLite error:", dbError);
          return {
            products: [],
            categories: [],
            settings: null
          };
        }
      }

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
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

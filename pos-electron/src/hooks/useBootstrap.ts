import { useQuery } from "@tanstack/react-query";

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

/**
 * useBootstrap Hook
 * 
 * Menggabungkan multiple API calls menjadi 1 call untuk initial load
 * Mengurangi latency di 3G connection
 * 
 * Sebelum: 3-4 API calls (products, categories, settings)
 * Sesudah: 1 API call (bootstrap)
 * 
 * Usage:
 * ```tsx
 * const { data, isLoading, error } = useBootstrap();
 * 
 * if (isLoading) return <Loading />;
 * if (error) return <Error />;
 * 
 * const { products, categories, settings } = data;
 * ```
 */
export function useBootstrap() {
  return useQuery<BootstrapData>({
    queryKey: ["bootstrap"],
    queryFn: async () => {
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
    staleTime: 10 * 60 * 1000, // 10 menit - cache lebih lama untuk bootstrap
    gcTime: 30 * 60 * 1000, // 30 menit
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}

/**
 * useProducts Hook (fallback/alternative)
 * Gunakan ini jika bootstrap tidak tersedia
 */
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

/**
 * useCategories Hook (fallback/alternative)
 * Gunakan ini jika bootstrap tidak tersedia
 */
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

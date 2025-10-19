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

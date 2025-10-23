import { useQuery } from "@tanstack/react-query";
import { productsApi, ProductsPaginationParams } from "../services/api";

export function useProducts(params?: ProductsPaginationParams) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => productsApi.getAll(params),
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

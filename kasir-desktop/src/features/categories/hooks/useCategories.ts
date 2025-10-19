import { useQuery } from "@tanstack/react-query";
import { categoriesApi } from "../services/api";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.getAll,
  });
}

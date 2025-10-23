import { useQuery } from "@tanstack/react-query";
import { categoriesApi } from "../services/api";

export function useCategories() {
  const isElectron = typeof window !== "undefined" && window.electronAPI?.isElectron;
  
  return useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.getAll,
    enabled: !isElectron || (isElectron && !!window.electronAPI),
  });
}

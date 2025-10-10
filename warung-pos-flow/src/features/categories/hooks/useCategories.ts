import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesApi } from "../services/api";
import { Category, CategoryFormData } from "../types";

export const useCategories = () => {
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const records = await categoriesApi.getAll();
      return records.map((record) => {
        const updatedAt = record.updated_at ?? null;
        const version =
          typeof record.version === "number"
            ? record.version
            : updatedAt
              ? Date.parse(String(updatedAt)) || 0
              : 0;

        return {
          id: record.id,
          name: record.name,
          created_at: record.created_at ?? null,
          updated_at: updatedAt,
          version,
          deleted_at: record.deleted_at ?? null,
        } as Category;
      });
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
};

export const useCategory = (id: number) => {
  return useQuery<Category>({
    queryKey: ["categories", id],
    queryFn: () => categoriesApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CategoryFormData) => categoriesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });
};

export const useUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoryFormData }) => categoriesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => categoriesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });
};

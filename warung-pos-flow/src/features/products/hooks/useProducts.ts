import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "../services/api";
import { Product, ProductFormData } from "../types";

export const useProducts = () => {
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const records = await productsApi.getAll();
      return records.map((record) => {
        const updatedAt = record.updated_at ?? null;
        const version =
          updatedAt != null
            ? Date.parse(String(updatedAt)) || 0
            : Number(record.version ?? 0);

        return {
          id: record.id,
          name: record.name,
          barcode: record.barcode ?? null,
          price: Number(record.price ?? 0),
          category_id: record.category_id ?? null,
          stock: Number(record.stock ?? 0),
          cost_price: Number(record.cost_price ?? record.price ?? 0),
          image: record.image ?? null,
          sku: record.sku ?? null,
          is_plu_enabled: Boolean(record.is_plu_enabled ?? false),
          description: record.description ?? null,
          is_active: Boolean(record.is_active ?? true),
          version,
          created_at: record.created_at ?? null,
          updated_at,
        };
      });
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
};

export const useProduct = (id: number) => {
  return useQuery<Product>({
    queryKey: ["products", id],
    queryFn: () => productsApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProductFormData) => productsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductFormData }) => productsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => productsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

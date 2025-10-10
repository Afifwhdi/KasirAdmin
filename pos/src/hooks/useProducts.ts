import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Product } from '@/types/product';

const parseNumeric = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const normalizeProduct = (item: Product): Product => {
  const updatedAt = item.updated_at ?? null;
  const version = updatedAt ? Date.parse(String(updatedAt)) || 0 : Number(item.version ?? 0);

  return {
    id: item.id,
    name: item.name,
    barcode: item.barcode ?? null,
    price: parseNumeric(item.price),
    category_id: item.category_id ?? null,
    stock: parseNumeric(item.stock),
    cost_price: parseNumeric(item.cost_price ?? item.price),
    image: item.image ?? null,
    sku: item.sku ?? null,
    is_plu_enabled: Boolean(item.is_plu_enabled ?? false),
    description: item.description ?? null,
    is_active: Boolean(item.is_active ?? true),
    version,
    created_at: item.created_at ?? null,
    updated_at: updatedAt,
  };
};

export const useProducts = () => {
  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const data = await api.products.getAll();
      return data.map(normalizeProduct);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useProduct = (id: number) => {
  return useQuery<Product>({
    queryKey: ['products', id],
    queryFn: async () => {
      const data = await api.products.getById(id);
      return normalizeProduct(data);
    },
    enabled: !!id,
  });
};

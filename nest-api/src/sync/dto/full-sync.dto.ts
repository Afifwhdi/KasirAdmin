export interface FullSyncQueryDto {
  productVersion?: string;
  categoryVersion?: string;
}

export interface FullSyncProductDto {
  id: number;
  category_id: number;
  name: string;
  barcode?: string | null;
  price: number;
  cost_price: number;
  stock: string | number;
  image?: string | null;
  sku?: string | null;
  is_plu_enabled: boolean;
  description?: string | null;
  is_active: boolean;
  version: number;
  updated_at: Date | null;
  deleted_at?: Date | null;
}

export interface FullSyncCategoryDto {
  id: number;
  name: string;
  version: number;
  updated_at: Date | null;
  deleted_at?: Date | null;
}

export interface FullSyncResponseDto {
  products: FullSyncProductDto[];
  categories: FullSyncCategoryDto[];
  removedProductIds: number[];
  removedCategoryIds: number[];
  meta: {
    productVersion: number;
    categoryVersion: number;
  };
}

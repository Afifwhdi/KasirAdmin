export interface Product {
  id: number;
  name: string;
  barcode: string | null;
  price: number;
  category_id: number | null;
  stock: number;
  created_at?: string | null;
  updated_at?: string | null;
  version?: number;
}

export interface ProductFormData {
  name: string;
  barcode?: string;
  price: number;
  category_id?: number;
  stock: number;
}

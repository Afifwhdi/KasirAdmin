export interface Product {
  id: number;
  name: string;
  barcode: string | null;
  price: number;
  category_id: number | null;
  stock: number;
  cost_price: number;
  image: string | null;
  sku: string | null;
  is_plu_enabled: boolean;
  description: string | null;
  is_active: boolean;
  version: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

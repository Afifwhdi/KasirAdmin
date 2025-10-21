export interface Product {
  id: number;
  uuid?: string; // Server's unique ID (used for sync)
  name: string;
  price: number;
  stock?: number; // Available stock
  category: {
    id: number;
    name: string;
  } | null;
  barcode?: string | null;
  is_plu_enabled?: boolean;
}

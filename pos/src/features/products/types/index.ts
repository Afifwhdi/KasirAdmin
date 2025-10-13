export interface Product {
  id: number;
  name: string;
  price: number;
  category: {
    id: number;
    name: string;
  } | null;
  barcode?: string | null;
  is_plu_enabled?: boolean;
}

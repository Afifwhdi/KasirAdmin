export interface Transaction {
  id?: number;
  uuid?: string;
  payment_method_id?: number;
  payment_method?: string | null;
  transaction_number?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  total: number;
  cash_received: number;
  change: number;
  created_at: Date | string;
  updated_at?: Date | string | null;
  deleted_at?: Date | string | null;
  idempotency_key?: string;
  status?: string;
  items?: TransactionItem[];
}

export interface TransactionItem {
  id?: number;
  transaction_id?: number;
  product_id: number;
  product_name?: string;
  price: number;
  qty: number;
  quantity?: number | string;
  subtotal: number;
}

export interface CreateTransactionData {
  payment_method_id?: number;
  transaction_number?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  total: number;
  cash_received: number;
  change: number;
  status?: string;
  items: {
    product_id: number;
    product_name?: string;
    price: number;
    qty: number;
    quantity?: number;
    subtotal: number;
  }[];
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

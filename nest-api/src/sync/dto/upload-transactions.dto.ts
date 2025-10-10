export interface UploadTransactionItemDto {
  product_id: number;
  quantity: number;
  price: number;
  subtotal: number;
  product_name?: string;
}

export interface UploadTransactionDto {
  uuid: string;
  transaction_number?: string;
  customer_name?: string;
  payment_method?: string | null;
  payment_method_id?: number | null;
  total: number;
  cash_received: number;
  change: number;
  notes?: string | null;
  created_at?: string;
  items: UploadTransactionItemDto[];
}

export interface UploadTransactionsDto {
  transactions: UploadTransactionDto[];
}

export interface Transaction {
  id: number;
  transaction_number: string;
  total_harga: number;
  nominal_bayar: number;
  kembalian: number;
  transaksi_dibuat: string;
  pembayaran: string;
  status: string;
}

export interface TransactionItem {
  product_id: number;
  product_name: string;
  price: number;
  qty: number;
  subtotal: number;
}

export interface CreateTransactionData {
  transaction_number: string;
  name?: string | null;
  payment_method_id: number;
  total: number;
  cash_received: number;
  change: number;
  items: TransactionItem[];
}

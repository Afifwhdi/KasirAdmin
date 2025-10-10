export class CreateTransactionItemDto {
  product_id: number;
  product_name?: string | null;
  price: number;
  qty: number;
  subtotal?: number;
}

export class CreateTransactionDto {
  transaction_number?: string;
  payment_method_id?: number;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  total: number;
  cash_received: number;
  change: number;
  status?: 'pending' | 'paid' | 'cancelled' | 'refunded';
  items: CreateTransactionItemDto[];
}

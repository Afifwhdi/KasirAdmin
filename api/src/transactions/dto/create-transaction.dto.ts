export class CreateTransactionItemDto {
  product_id!: number;
  product_name_snapshot?: string;
  quantity!: number;
  price!: number;
  subtotal?: number;
  cost_price?: number;
  total_profit?: number;
}

export class CreateTransactionDto {
  payment_method_id!: number;
  transaction_number!: string;
  name?: string;
  total!: number;
  cash_received!: number;
  change_amount!: number;
  status?: 'pending' | 'paid' | 'cancelled' | 'refunded';
  items!: CreateTransactionItemDto[];
}

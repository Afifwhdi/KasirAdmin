export interface UploadStockChangeDto {
  uuid: string;
  product_id: number;
  change_qty: number;
  source: string;
  reference_uuid?: string;
  created_at?: string;
}

export interface UploadStockChangesDto {
  stock_changes: UploadStockChangeDto[];
}

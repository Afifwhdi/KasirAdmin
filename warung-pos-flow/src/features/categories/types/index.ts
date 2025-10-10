export interface Category {
  id: number;
  name: string;
  created_at?: Date | string | null;
  updated_at?: Date | string | null;
  version?: number;
  deleted_at?: Date | string | null;
}

export interface CategoryFormData {
  name: string;
  description?: string;
}

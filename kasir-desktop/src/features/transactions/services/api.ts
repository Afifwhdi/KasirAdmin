import { API_CONFIG, API_ENDPOINTS } from "@/config/api";

export interface CreateTransactionData {
  transaction_number: string;
  name?: string;
  payment_method_id: number;
  total: number;
  cash_received: number;
  change_amount: number;
  status?: "pending" | "paid" | "cancelled" | "refunded";
  items: {
    product_id: string | number; // Can be UUID (string) or local ID (number)
    product_name_snapshot: string;
    quantity: number;
    price: number;
    subtotal: number;
    cost_price: number;
    total_profit: number;
  }[];
}

export interface TransactionsPaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface TransactionsPaginationResponse {
  status: string;
  message: string;
  data: Record<string, unknown>[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const transactionsApi = {
  async getAll(params?: TransactionsPaginationParams): Promise<TransactionsPaginationResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);
    if (params?.status) queryParams.append("status", params.status);

    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.TRANSACTIONS}${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("Gagal memuat transaksi");
    return res.json();
  },

  async create(data: CreateTransactionData) {
    console.log("[TransactionsAPI] Creating transaction:", {
      transaction_number: data.transaction_number,
      total: data.total,
      items_count: data.items.length,
    });

    const res = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.TRANSACTIONS}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      let errorDetail = "";
      let errorMessage = "";
      
      try {
        const errorData = await res.json();
        errorDetail = JSON.stringify(errorData, null, 2); // Pretty print
        errorMessage = errorData.message || errorData.error || "Unknown error";
        

        console.error("❌❌❌ [TransactionsAPI] SYNC ERROR DETAIL ❌❌❌");
        console.error("Status Code:", res.status);
        console.error("Status Text:", res.statusText);
        console.error("Error Message:", errorMessage);
        console.error("Full Error Response:", errorData);
        console.error("Request Payload:", data);
        console.error("❌❌❌ END OF ERROR DETAIL ❌❌❌");
      } catch {
        errorDetail = await res.text();
        errorMessage = errorDetail;
        console.error("❌❌❌ [TransactionsAPI] SERVER ERROR (TEXT) ❌❌❌");
        console.error("Status Code:", res.status);
        console.error("Error Text:", errorDetail);
        console.error("Request Payload:", data);
        console.error("❌❌❌ END OF ERROR ❌❌❌");
      }
      
      const error: any = new Error(`HTTP ${res.status}: ${errorMessage}`);
      error.status = res.status;
      error.response = errorDetail;
      throw error;
    }

    const result = await res.json();

    return result;
  },

  async updateStatus(id: number, status: "pending" | "paid" | "cancelled" | "refunded") {
    const res = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.TRANSACTIONS}/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gagal update status: ${err}`);
    }

    return res.json();
  },

  async payBon(id: number, cashReceived: number, changeAmount: number) {
    const res = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.TRANSACTIONS}/${id}/pay`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cash_received: cashReceived, change_amount: changeAmount }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gagal bayar BON: ${err}`);
    }

    return res.json();
  },

  async getDetail(id: number) {
    const res = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.TRANSACTIONS}/${id}`);

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gagal memuat detail transaksi: ${err}`);
    }

    return res.json();
  },
};

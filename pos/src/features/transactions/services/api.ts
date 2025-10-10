import { Transaction, CreateTransactionData } from '../types';
import { API_CONFIG, API_ENDPOINTS } from '@/config/api';

const API_BASE_URL = API_CONFIG.BASE_URL;

export const transactionsApi = {
  // Get all transactions
  getAll: async (): Promise<Transaction[]> => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.TRANSACTIONS}`);
    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }
    return response.json();
  },

  // Get transaction by ID
  getById: async (id: number): Promise<Transaction> => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.TRANSACTIONS}/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch transaction');
    }
    return response.json();
  },

  // Get items by transaction ID
  getItemsByTransaction: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.TRANSACTIONS}/${id}/items`);
    if (!response.ok) {
      throw new Error('Failed to fetch transaction items');
    }
    return response.json();
  },

  // Create new transaction
  create: async (data: CreateTransactionData): Promise<Transaction> => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.TRANSACTIONS}`, {
      method: 'POST',
      headers: API_CONFIG.HEADERS,
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create transaction');
    }
    return response.json();
  },

  // Get transactions by date range (if backend supports query)
  getByDateRange: async (startDate: string, endDate: string): Promise<Transaction[]> => {
    const url = new URL(`${API_BASE_URL}${API_ENDPOINTS.TRANSACTIONS}`);
    url.searchParams.set('startDate', startDate);
    url.searchParams.set('endDate', endDate);
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }
    return response.json();
  },
};

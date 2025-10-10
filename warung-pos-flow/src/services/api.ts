const API_BASE_URL = 'http://127.0.0.1:3000';

export const api = {
  products: {
    getAll: async () => {
      const response = await fetch(`${API_BASE_URL}/products`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return response.json();
    },
    
    getById: async (id: number) => {
      const response = await fetch(`${API_BASE_URL}/products/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }
      return response.json();
    },
  },
};

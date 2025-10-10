// src/services/api.ts
/**
 * PURE FRONTEND MODE (NO FETCH)
 * Semua data disimulasikan langsung dari frontend
 */

export const api = {
  products: {
    getAll: async () => {
      // simulasi delay biar kayak loading
      await new Promise((r) => setTimeout(r, 400));

      // data dummy
      return [
        {
          id: 1,
          name: "Kopi Susu Gula Aren",
          category: "Minuman",
          price: 25000,
        },
        { id: 2, name: "Teh Botol Sosro", category: "Minuman", price: 5000 },
        {
          id: 3,
          name: "Roti Tawar Serbaguna",
          category: "Makanan",
          price: 18000,
        },
        {
          id: 4,
          name: "Sabun Lifebuoy",
          category: "Kebutuhan Rumah",
          price: 7500,
        },
      ];
    },

    getById: async (id: number) => {
      await new Promise((r) => setTimeout(r, 200));
      const products = [
        { id: 1, name: "Kopi Susu Gula Aren", price: 25000 },
        { id: 2, name: "Teh Botol Sosro", price: 5000 },
        { id: 3, name: "Roti Tawar Serbaguna", price: 18000 },
        { id: 4, name: "Sabun Lifebuoy", price: 7500 },
      ];
      return products.find((p) => p.id === id) || null;
    },
  },
};

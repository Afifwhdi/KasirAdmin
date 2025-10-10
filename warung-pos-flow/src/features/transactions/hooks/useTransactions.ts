import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionsApi } from "../services/api";
import { Transaction, CreateTransactionData, TransactionItem } from "../types";

const toNumber = (value: number | string | undefined | null) => {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

export const useTransactions = () => {
  return useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: async () => {
      const records = await transactionsApi.getAll();
      return records.map((record) => ({
        ...record,
        total: toNumber(record.total),
        cash_received: toNumber(record.cash_received),
        change: toNumber(record.change),
        created_at: record.created_at,
        updated_at: record.updated_at ?? record.created_at ?? null,
        items: (record.items ?? []).map((item) => ({
          ...item,
          price: toNumber(item.price),
          qty: toNumber(item.qty ?? item.quantity),
          subtotal: toNumber(item.subtotal),
        })),
      }));
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
};

export const useTransaction = (id: number) => {
  return useQuery<Transaction>({
    queryKey: ["transactions", id],
    queryFn: () => transactionsApi.getById(id),
    enabled: !!id,
  });
};

export const useTransactionItems = (id: number) => {
  return useQuery<TransactionItem[]>({
    queryKey: ["transactions", id, "items"],
    queryFn: () => transactionsApi.getItemsByTransaction(id),
    enabled: !!id,
  });
};

export const useCreateTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTransactionData) => transactionsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
};

export const useTransactionsByDateRange = (startDate: string, endDate: string) => {
  return useQuery<Transaction[]>({
    queryKey: ["transactions", "dateRange", startDate, endDate],
    queryFn: () => transactionsApi.getByDateRange(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
};

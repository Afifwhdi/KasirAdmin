import { useQuery } from "@tanstack/react-query";
import { transactionsApi, TransactionsPaginationParams } from "../services/api";

export function useTransactions(params?: TransactionsPaginationParams) {
  return useQuery({
    queryKey: ["transactions", params],
    queryFn: () => transactionsApi.getAll(params),
  });
}

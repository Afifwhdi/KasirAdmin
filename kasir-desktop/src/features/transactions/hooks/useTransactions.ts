import { useQuery } from "@tanstack/react-query";
import { TransactionsPaginationParams } from "../services/api";
import { transactionsWrapper } from "@/services/transactions-wrapper";

export function useTransactions(params?: TransactionsPaginationParams) {
  return useQuery({
    queryKey: ["transactions", params],
    queryFn: () => transactionsWrapper.getAll(params),
  });
}

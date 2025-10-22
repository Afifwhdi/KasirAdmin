import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Search,
  Eye,
  Printer,
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  XCircle,
  RefreshCcw,
} from "lucide-react";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { id } from "date-fns/locale";
import { useTransactions } from "@/features/transactions";
import { transactionsWrapper } from "@/services/transactions-wrapper";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const ITEMS_PER_PAGE = 10;

const TransactionHistory = () => {
  const queryClient = useQueryClient();
  const { data: transactions = [], isLoading, error } = useTransactions();
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<Record<string, unknown> | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);


  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {

      const matchesSearch =
        searchQuery === "" ||
        transaction.transaction_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (transaction.uuid?.toLowerCase()?.includes(searchQuery.toLowerCase()) ?? false) ||
        (transaction.id !== undefined && transaction.id.toString().includes(searchQuery));


      const matchesDate =
        !startDate ||
        !endDate ||
        isWithinInterval(new Date(transaction.created_at), {
          start: startOfDay(new Date(startDate)),
          end: endOfDay(new Date(endDate)),
        });

      return matchesSearch && matchesDate;
    });
  }, [transactions, searchQuery, startDate, endDate]);


  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);


  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, startDate, endDate]);

  const handleClearDateFilter = () => {
    setStartDate("");
    setEndDate("");
    setShowDateFilter(false);
  };

  const getStatusBadge = (status?: string) => {
    if (status === "completed" || status === "success") {
      return (
        <Badge variant="default" className="bg-success">
          Selesai
        </Badge>
      );
    }
    if (status === "pending") {
      return (
        <Badge variant="secondary" className="bg-warning">
          Pending
        </Badge>
      );
    }
    return <Badge variant="secondary">-</Badge>;
  };

  const getPaymentMethodLabel = (methodId?: number, method?: string | null) => {
    if (method && method.toLowerCase() === "cash") return "Tunai";
    if (method && method.toLowerCase() === "credit") return "Bon/Piutang";
    if (methodId === 1) return "Tunai";
    if (methodId === 2) return "Bon/Piutang";
    return "-";
  };

  const handleViewDetail = async (transaction: Record<string, unknown>) => {
    try {
      const result = await transactionsWrapper.getDetail(transaction.id);
      setSelectedTransaction(result.data || transaction);
      setShowDetailDialog(true);
    } catch (error) {
      console.error("Failed to load transaction detail:", error);

      setSelectedTransaction(transaction);
      setShowDetailDialog(true);
    }
  };

  const handleCancelTransaction = async () => {
    if (!selectedTransaction || isProcessing) return;

    if (!confirm("Yakin ingin membatalkan transaksi ini?")) return;

    setIsProcessing(true);
    try {
      await transactionsWrapper.updateStatus(selectedTransaction.id, "cancelled");

      toast.success("Transaksi dibatalkan", {
        icon: "✓",
        style: { background: "#10b981", color: "white" },
      });


      await queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setShowDetailDialog(false);
      setSelectedTransaction(null);
    } catch (error) {
      console.error("Failed to cancel transaction:", error);
      toast.error("Gagal membatalkan transaksi: " + (error as Error).message, {
        icon: "❌",
        style: { background: "#ef4444", color: "white" },
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefundTransaction = async () => {
    if (!selectedTransaction || isProcessing) return;

    if (!confirm("Yakin ingin refund transaksi ini?")) return;

    setIsProcessing(true);
    try {
      await transactionsWrapper.updateStatus(selectedTransaction.id, "refunded");

      toast.success("Transaksi di-refund", {
        icon: "✓",
        style: { background: "#10b981", color: "white" },
      });


      await queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setShowDetailDialog(false);
      setSelectedTransaction(null);
    } catch (error) {
      console.error("Failed to refund transaction:", error);
      toast.error("Gagal refund transaksi: " + (error as Error).message, {
        icon: "❌",
        style: { background: "#ef4444", color: "white" },
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-6">
      {/* Fixed Header */}
      <div className="flex-shrink-0 mb-6">
        <h1 className="text-3xl font-bold mb-2">Riwayat Transaksi</h1>
        <p className="text-muted-foreground">Kelola dan pantau semua transaksi toko</p>
      </div>

      {/* Fixed Search & Filter */}
      <Card className="flex-shrink-0 p-6 mb-6">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Cari berdasarkan nomor transaksi atau nama customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={showDateFilter || startDate ? "default" : "outline"}
              className="gap-2"
              onClick={() => setShowDateFilter(!showDateFilter)}
            >
              <Calendar className="w-4 h-4" />
              Filter Tanggal
              {startDate && endDate && (
                <X
                  className="w-4 h-4 ml-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearDateFilter();
                  }}
                />
              )}
            </Button>
          </div>

          {/* Date Range Picker */}
          {showDateFilter && (
            <div className="flex flex-col md:flex-row gap-4 p-4 bg-secondary/50 rounded-lg">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Tanggal Mulai</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Tanggal Akhir</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button variant="outline" onClick={handleClearDateFilter} className="h-10">
                  Reset
                </Button>
              </div>
            </div>
          )}

          {/* Active Filters Info */}
          {startDate && endDate && (
            <div className="text-sm text-muted-foreground">
              Menampilkan transaksi dari{" "}
              {format(new Date(startDate), "dd MMM yyyy", { locale: id })}
              sampai {format(new Date(endDate), "dd MMM yyyy", { locale: id })}
            </div>
          )}
        </div>
      </Card>

      {/* Scrollable Table Container */}
      <Card className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Transaksi</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Total Harga</TableHead>
                <TableHead className="text-right">Nominal Bayar</TableHead>
                <TableHead className="text-right">Kembalian</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Pembayaran</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span className="text-muted-foreground">Memuat transaksi...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-destructive mb-2">Gagal memuat transaksi</p>
                      <p className="text-sm text-muted-foreground">{error.message}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-3">
                        <span className="text-3xl">📋</span>
                      </div>
                      <p className="text-muted-foreground">Tidak ada transaksi ditemukan</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTransactions.map((transaction) => (
                  <TableRow
                    key={
                      transaction.uuid ??
                      transaction.transaction_number ??
                      String(transaction.created_at)
                    }
                  >
                    <TableCell className="font-medium">
                      {transaction.transaction_number || transaction.uuid || "TRX"}
                    </TableCell>
                    <TableCell>{transaction.name || "-"}</TableCell>
                    <TableCell className="text-right font-semibold">
                      Rp {Number(transaction.total).toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-right">
                      Rp {Number(transaction.cash_received).toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-right">
                      {transaction.payment_method?.toLowerCase() === "cash" ||
                      transaction.payment_method_id === 1 ? (
                        <span className="text-success">
                          Rp {Number(transaction.change).toLocaleString("id-ID")}
                        </span>
                      ) : (
                        <span className="text-warning">Bon</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(transaction.created_at), "dd MMM yyyy, HH:mm", {
                        locale: id,
                      })}
                    </TableCell>
                    <TableCell>
                      {getPaymentMethodLabel(
                        transaction.payment_method_id,
                        transaction.payment_method
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Lihat Detail"
                          onClick={() => handleViewDetail(transaction)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" title="Print Struk">
                          <Printer className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {filteredTransactions.length > 0 && (
          <div className="flex-shrink-0 border-t p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)} dari{" "}
                {filteredTransactions.length} transaksi
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {

                      return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                    })
                    .map((page, index, array) => (
                      <>
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span key={`ellipsis-${page}`} className="px-2">
                            ...
                          </span>
                        )}
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-10"
                        >
                          {page}
                        </Button>
                      </>
                    ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Transaction Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Transaksi</DialogTitle>
            <DialogDescription>Informasi lengkap transaksi</DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4">
              {/* Transaction Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">No. Transaksi</p>
                  <p className="font-semibold">
                    {selectedTransaction.transaction_number || selectedTransaction.uuid}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-semibold">
                    {selectedTransaction.name || selectedTransaction.customer_name || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal</p>
                  <p className="font-semibold">
                    {format(new Date(selectedTransaction.created_at), "dd MMM yyyy, HH:mm", {
                      locale: id,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedTransaction.status)}</div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-semibold mb-2">Item Transaksi</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produk</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Harga</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {((selectedTransaction.items as Record<string, unknown>[]) || []).map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.product_name || item.product_name_snapshot}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">
                            Rp {Number(item.price).toLocaleString("id-ID")}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            Rp {Number(item.subtotal).toLocaleString("id-ID")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-bold text-lg">
                      Rp {Number(selectedTransaction.total).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pembayaran:</span>
                    <span>
                      {getPaymentMethodLabel(
                        selectedTransaction.payment_method_id,
                        selectedTransaction.payment_method
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Nominal Bayar:</span>
                    <span>
                      Rp{" "}
                      {Number(
                        selectedTransaction.cash_received || selectedTransaction.payment_amount
                      ).toLocaleString("id-ID")}
                    </span>
                  </div>
                  {(selectedTransaction.change_amount > 0 || selectedTransaction.change > 0) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Kembalian:</span>
                      <span className="text-success">
                        Rp{" "}
                        {Number(
                          selectedTransaction.change_amount || selectedTransaction.change || 0
                        ).toLocaleString("id-ID")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Tutup
            </Button>
            {selectedTransaction?.status !== "cancelled" &&
              selectedTransaction?.status !== "refunded" && (
                <>
                  <Button
                    variant="destructive"
                    onClick={handleCancelTransaction}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    Batal Transaksi
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleRefundTransaction}
                    disabled={isProcessing}
                    className="border-orange-500 text-orange-600 hover:bg-orange-50"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCcw className="w-4 h-4 mr-2" />
                    )}
                    Refund
                  </Button>
                </>
              )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransactionHistory;

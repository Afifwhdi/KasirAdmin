import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, ChevronLeft, ChevronRight, Ban, Undo2, Eye, ShoppingBag } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useTransactions } from "@/features/transactions";
import { transactionsWrapper } from "@/services/transactions-wrapper";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { PayBonModal } from "@/features/pos/components/PayBonModal";

const ITEMS_PER_PAGE = 10;

type StatusFilter = "all" | "paid" | "pending" | "cancelled" | "refunded";

const TransactionsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: "cancel" | "refund" | "pay" | null;
    transactionId: number | null;
    transactionNumber: string;
  }>({
    open: false,
    type: null,
    transactionId: null,
    transactionNumber: "",
  });

  const [payBonModal, setPayBonModal] = useState<{
    open: boolean;
    transactionId: number | null;
    transactionNumber: string;
    customerName: string;
    total: number;
  }>({
    open: false,
    transactionId: null,
    transactionNumber: "",
    customerName: "",
    total: 0,
  });

  const [detailModal, setDetailModal] = useState<{
    open: boolean;
    loading: boolean;
    transactionNumber: string;
    items: any[];
  }>({
    open: false,
    loading: false,
    transactionNumber: "",
    items: [],
  });

  const queryClient = useQueryClient();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  // Server-side pagination with status filter
  const { data, isLoading, error } = useTransactions({
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    search: debouncedSearch || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const transactions = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, limit: 10, totalPages: 0 };
  const totalPages = meta.totalPages;

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      Lunas: { label: "Lunas", className: "bg-green-500 hover:bg-green-600 text-white" },
      Menunggu: { label: "Menunggu", className: "bg-yellow-500 hover:bg-yellow-600 text-white" },
      Dibatalkan: { label: "Dibatalkan", className: "bg-red-500 hover:bg-red-600 text-white" },
      Refund: { label: "Refund", className: "bg-blue-500 hover:bg-blue-600 text-white" },
    };

    const statusInfo = statusMap[status] || { label: status, className: "bg-gray-500" };
    
    return (
      <Badge className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    );
  };

  const handleStatusUpdate = async () => {
    if (!actionDialog.transactionId || !actionDialog.type) return;

    let newStatus: 'paid' | 'cancelled' | 'refunded';
    if (actionDialog.type === "cancel") {
      newStatus = "cancelled";
    } else if (actionDialog.type === "pay") {
      newStatus = "paid";
    } else {
      newStatus = "refunded";
    }
    
    try {
      await transactionsWrapper.updateStatus(actionDialog.transactionId, newStatus);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      
      const successMessage = 
        newStatus === "cancelled" 
          ? "dibatalkan"
          : newStatus === "paid"
            ? "lunas. Pembayaran berhasil dicatat."
            : "direfund. Stock produk telah dikembalikan.";
      
      toast.success(`Transaksi ${actionDialog.transactionNumber} berhasil ${successMessage}`);
      
      setActionDialog({ open: false, type: null, transactionId: null, transactionNumber: "" });
    } catch (error) {
      const errorMessage = 
        newStatus === "cancelled" 
          ? "membatalkan"
          : newStatus === "paid"
            ? "memproses pembayaran"
            : "merefund";
      toast.error(`Gagal ${errorMessage} transaksi`);
    }
  };

  const openActionDialog = (
    type: "cancel" | "refund" | "pay",
    transactionId: number,
    transactionNumber: string,
    customerName?: string,
    total?: number
  ) => {
    if (type === "pay" && customerName !== undefined && total !== undefined) {
      // Buka modal khusus bayar BON
      setPayBonModal({
        open: true,
        transactionId,
        transactionNumber,
        customerName,
        total,
      });
    } else {
      setActionDialog({
        open: true,
        type,
        transactionId,
        transactionNumber,
      });
    }
  };

  const handlePayBon = async (amountPaid: number) => {
    if (!payBonModal.transactionId) return;

    try {
      const changeAmount = amountPaid - payBonModal.total;
      
      await transactionsWrapper.payBon(
        payBonModal.transactionId,
        amountPaid,
        changeAmount
      );

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["transactions"] });

      toast.success(`Pembayaran BON ${payBonModal.transactionNumber} berhasil dicatat!`);

      setPayBonModal({
        open: false,
        transactionId: null,
        transactionNumber: "",
        customerName: "",
        total: 0,
      });
    } catch (error) {
      toast.error("Gagal memproses pembayaran BON");
      console.error(error);
    }
  };

  const handleViewDetail = async (transactionId: number, transactionNumber: string) => {
    setDetailModal({
      open: true,
      loading: true,
      transactionNumber,
      items: [],
    });

    try {
      const response = await transactionsWrapper.getDetail(transactionId);
      
      if (response.status === "success") {
        setDetailModal({
          open: true,
          loading: false,
          transactionNumber,
          items: response.data.items || [],
        });
      } else {
        throw new Error("Failed to load transaction details");
      }
    } catch (error) {
      toast.error("Gagal memuat detail transaksi");
      setDetailModal({
        open: false,
        loading: false,
        transactionNumber: "",
        items: [],
      });
    }
  };

  const canCancel = (status: string) => status === "Lunas" || status === "Menunggu";
  const canRefund = (status: string) => status === "Lunas";
  const canPay = (status: string) => status === "Menunggu";

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-6">
      {/* Header */}
      <div className="flex-shrink-0 mb-6">
        <h1 className="text-3xl font-bold mb-2">Riwayat Transaksi</h1>
        <p className="text-muted-foreground">
          Kelola dan pantau semua transaksi toko
        </p>
      </div>

      {/* Filters */}
      <Card className="flex-shrink-0 p-6 mb-6 space-y-4">
        {/* Tabs Filter */}
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="paid">Lunas</TabsTrigger>
            <TabsTrigger value="pending">Menunggu</TabsTrigger>
            <TabsTrigger value="cancelled">Dibatalkan</TabsTrigger>
            <TabsTrigger value="refunded">Refund</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Cari berdasarkan nomor transaksi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Table */}
      <Card className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Transaksi</TableHead>
                <TableHead>Nama Customer</TableHead>
                <TableHead className="text-right">Total Harga</TableHead>
                <TableHead className="text-right">Nominal Bayar</TableHead>
                <TableHead className="text-right">Kembalian</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Pembayaran</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span className="text-muted-foreground">
                        Memuat transaksi...
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-destructive mb-2">
                        Gagal memuat transaksi
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {error.message}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-3">
                        <span className="text-3xl">📋</span>
                      </div>
                      <p className="text-muted-foreground">
                        Tidak ada transaksi ditemukan
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      {transaction.transaction_number}
                    </TableCell>
                    <TableCell>
                      {transaction.nama_customer || "Umum"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      Rp {Number(transaction.total_harga).toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-right">
                      Rp {Number(transaction.nominal_bayar).toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-green-600">
                        Rp {Number(transaction.kembalian).toLocaleString("id-ID")}
                      </span>
                    </TableCell>
                    <TableCell>
                      {format(
                        new Date(transaction.transaksi_dibuat),
                        "dd MMM yyyy, HH:mm",
                        { locale: id }
                      )}
                    </TableCell>
                    <TableCell>{transaction.pembayaran}</TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleViewDetail(
                              transaction.id,
                              transaction.transaction_number
                            )
                          }
                          className="h-8"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Detail
                        </Button>
                        {canCancel(transaction.status) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              openActionDialog(
                                "cancel",
                                transaction.id,
                                transaction.transaction_number
                              )
                            }
                            className="h-8"
                          >
                            <Ban className="w-3 h-3 mr-1" />
                            Batal
                          </Button>
                        )}
                        {canRefund(transaction.status) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              openActionDialog(
                                "refund",
                                transaction.id,
                                transaction.transaction_number
                              )
                            }
                            className="h-8"
                          >
                            <Undo2 className="w-3 h-3 mr-1" />
                            Refund
                          </Button>
                        )}
                        {canPay(transaction.status) && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() =>
                              openActionDialog(
                                "pay",
                                transaction.id,
                                transaction.transaction_number,
                                transaction.nama_customer,
                                Number(transaction.total_harga)
                              )
                            }
                            className="h-8 bg-green-600 hover:bg-green-700"
                          >
                            💰 Bayar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {meta.total > 0 && (
          <div className="flex-shrink-0 border-t p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Menampilkan {(meta.page - 1) * meta.limit + 1} -{" "}
                {Math.min(meta.page * meta.limit, meta.total)} dari {meta.total}{" "}
                transaksi
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
                      return (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1
                      );
                    })
                    .map((page, index, array) => (
                      <React.Fragment key={`page-${page}`}>
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="px-2">
                            ...
                          </span>
                        )}
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-10"
                        >
                          {page}
                        </Button>
                      </React.Fragment>
                    ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
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

      {/* Action Confirmation Dialog */}
      <AlertDialog open={actionDialog.open} onOpenChange={(open) => 
        setActionDialog({ ...actionDialog, open })
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog.type === "cancel" 
                ? "Batalkan Transaksi?" 
                : actionDialog.type === "pay"
                  ? "Konfirmasi Pembayaran"
                  : "Refund Transaksi?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionDialog.type === "cancel"
                ? `Apakah Anda yakin ingin membatalkan transaksi ${actionDialog.transactionNumber}? Tindakan ini tidak dapat dibatalkan.`
                : actionDialog.type === "pay"
                  ? `Konfirmasi bahwa pembayaran untuk transaksi ${actionDialog.transactionNumber} sudah diterima. Status akan berubah menjadi Lunas.`
                  : `Apakah Anda yakin ingin merefund transaksi ${actionDialog.transactionNumber}? Stock produk akan dikembalikan.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusUpdate}
              className={
                actionDialog.type === "cancel" 
                  ? "bg-red-600 hover:bg-red-700" 
                  : actionDialog.type === "pay"
                    ? "bg-green-600 hover:bg-green-700"
                    : ""
              }
            >
              {actionDialog.type === "cancel" 
                ? "Ya, Batalkan" 
                : actionDialog.type === "pay"
                  ? "Ya, Sudah Dibayar"
                  : "Ya, Refund"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pay BON Modal */}
      <PayBonModal
        open={payBonModal.open}
        onClose={() =>
          setPayBonModal({
            open: false,
            transactionId: null,
            transactionNumber: "",
            customerName: "",
            total: 0,
          })
        }
        total={payBonModal.total}
        customerName={payBonModal.customerName}
        transactionNumber={payBonModal.transactionNumber}
        onComplete={handlePayBon}
      />

      {/* Detail Items Modal - Receipt Style */}
      <Dialog 
        open={detailModal.open} 
        onOpenChange={(open) => {
          if (!open) {
            setDetailModal({
              open: false,
              loading: false,
              transactionNumber: "",
              items: [],
            });
          }
        }}
      >
        <DialogContent className="max-w-md max-h-[90vh] p-0">
          <div className="overflow-y-auto max-h-[90vh]">
            {detailModal.loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Memuat detail...</span>
              </div>
            ) : detailModal.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <ShoppingBag className="w-10 h-10 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">Tidak ada item ditemukan</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-950 p-6 font-mono text-sm">
                {/* Header - Nama Toko */}
                <div className="text-center mb-4">
                  <h1 className="text-xl font-bold mb-1">DILLA STORE</h1>
                  <p className="text-xs text-muted-foreground">
                    Jl. Contoh No. 123, Jakarta
                  </p>
                  <p className="text-xs text-muted-foreground">Telp: 021-1234567</p>
                </div>

                {/* Divider */}
                <div className="border-b-2 border-dashed border-gray-300 my-3"></div>

                {/* Transaction Info */}
                <div className="text-xs space-y-1 mb-3">
                  <div className="flex justify-between">
                    <span>No. Transaksi</span>
                    <span className="font-semibold">{detailModal.transactionNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tanggal</span>
                    <span>{format(new Date(), "dd/MM/yyyy HH:mm", { locale: id })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kasir</span>
                    <span>{localStorage.getItem("username") || "Admin"}</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-b-2 border-dashed border-gray-300 my-3"></div>

                {/* Items List */}
                <div className="space-y-2 mb-3">
                  {detailModal.items.map((item, index) => (
                    <div key={index} className="space-y-1">
                      <div className="font-medium">
                        {item.product_name_snapshot || item.product?.name || "-"}
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>
                          {item.quantity} x Rp {Number(item.price).toLocaleString("id-ID")}
                        </span>
                        <span className="font-semibold">
                          Rp {Number(item.subtotal).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Divider */}
                <div className="border-b-2 border-dashed border-gray-300 my-3"></div>

                {/* Summary */}
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-xs">
                    <span>Subtotal</span>
                    <span>
                      Rp{" "}
                      {detailModal.items
                        .reduce((sum, item) => sum + Number(item.subtotal), 0)
                        .toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-2 border-t">
                    <span>TOTAL</span>
                    <span>
                      Rp{" "}
                      {detailModal.items
                        .reduce((sum, item) => sum + Number(item.subtotal), 0)
                        .toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-b-2 border-dashed border-gray-300 my-3"></div>

                {/* Footer */}
                <div className="text-center text-xs space-y-1">
                  <p className="font-semibold">TERIMA KASIH</p>
                  <p className="text-muted-foreground">Barang yang sudah dibeli</p>
                  <p className="text-muted-foreground">tidak dapat ditukar/dikembalikan</p>
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-muted-foreground">
                      Total Item: {detailModal.items.length} • Qty:{" "}
                      {detailModal.items.reduce((sum, item) => sum + Number(item.quantity), 0)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransactionsPage;

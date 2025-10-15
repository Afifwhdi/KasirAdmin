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
import { Search, Eye, Printer, Calendar, Loader2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { id } from "date-fns/locale";
import { useTransactions } from "@/features/transactions";

const ITEMS_PER_PAGE = 10;

const TransactionHistory = () => {
  const { data: transactions = [], isLoading, error } = useTransactions();
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      // Search filter
      const matchesSearch = searchQuery === "" || 
        transaction.transaction_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (transaction.uuid?.toLowerCase()?.includes(searchQuery.toLowerCase()) ?? false) ||
        (transaction.id !== undefined && transaction.id.toString().includes(searchQuery));
      
      // Date filter
      const matchesDate = (!startDate || !endDate) || isWithinInterval(
        new Date(transaction.created_at),
        {
          start: startOfDay(new Date(startDate)),
          end: endOfDay(new Date(endDate))
        }
      );
      
      return matchesSearch && matchesDate;
    });
  }, [transactions, searchQuery, startDate, endDate]);
  
  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);
  
  // Reset to page 1 when filter changes
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
      return <Badge variant="default" className="bg-success">Selesai</Badge>;
    }
    if (status === "pending") {
      return <Badge variant="secondary" className="bg-warning">Pending</Badge>;
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
  
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-6">
      {/* Fixed Header */}
      <div className="flex-shrink-0 mb-6">
        <h1 className="text-3xl font-bold mb-2">Riwayat Transaksi</h1>
        <p className="text-muted-foreground">
          Kelola dan pantau semua transaksi toko
        </p>
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
                <X className="w-4 h-4 ml-1" onClick={(e) => { e.stopPropagation(); handleClearDateFilter(); }} />
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
                <Button 
                  variant="outline" 
                  onClick={handleClearDateFilter}
                  className="h-10"
                >
                  Reset
                </Button>
              </div>
            </div>
          )}
          
          {/* Active Filters Info */}
          {(startDate && endDate) && (
            <div className="text-sm text-muted-foreground">
              Menampilkan transaksi dari {format(new Date(startDate), "dd MMM yyyy", { locale: id })} 
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
                  <TableRow key={transaction.uuid ?? transaction.transaction_number ?? String(transaction.created_at)}>
                    <TableCell className="font-medium">
                      {transaction.transaction_number || transaction.uuid || "TRX"}
                    </TableCell>
                    <TableCell>{transaction.name || "-"}</TableCell>
                    <TableCell className="text-right font-semibold">
                      Rp {Number(transaction.total).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="text-right">
                      Rp {Number(transaction.cash_received).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="text-right">
                      {transaction.payment_method?.toLowerCase() === "cash" || transaction.payment_method_id === 1 ? (
                        <span className="text-success">
                          Rp {Number(transaction.change).toLocaleString('id-ID')}
                        </span>
                      ) : (
                        <span className="text-warning">Bon</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(transaction.created_at), "dd MMM yyyy, HH:mm", { locale: id })}
                    </TableCell>
                    <TableCell>{getPaymentMethodLabel(transaction.payment_method_id, transaction.payment_method)}</TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="ghost" title="Lihat Detail">
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
                Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)} dari {filteredTransactions.length} transaksi
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Show first, last, current, and adjacent pages
                      return page === 1 || 
                             page === totalPages || 
                             Math.abs(page - currentPage) <= 1;
                    })
                    .map((page, index, array) => (
                      <>
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span key={`ellipsis-${page}`} className="px-2">...</span>
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
                    ))
                  }
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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
    </div>
  );
};

export default TransactionHistory;

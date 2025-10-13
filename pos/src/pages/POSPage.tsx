import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { useProducts } from "@/features/products/hooks/useProducts";
import { useCategories } from "@/features/categories/hooks/useCategories";
import {
  transactionsApi,
  CreateTransactionData,
} from "@/features/transactions/services/api";
import { API_CONFIG, API_ENDPOINTS } from "@/config/api";

import { ProductCard, CartItem, PaymentModal, PLUModal } from "@/features/pos";
import { Product } from "@/features/products/types";
import { PrinterService, ReceiptData } from "@/services/printer";
type CartItemType = Product & {
  quantity: number;
  locked?: boolean;
  pluWeight?: number;
  actualPrice?: number;
};

const POSPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<number | "all">(
    "all"
  );
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [cart, setCart] = useState<CartItemType[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPLUModalOpen, setIsPLUModalOpen] = useState(false);
  const [selectedPLUProduct, setSelectedPLUProduct] = useState<Product | null>(
    null
  );
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const orderNumber = `TRX-${Date.now().toString().slice(-6)}`;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data: productsData,
    isLoading,
    error,
  } = useProducts({
    page,
    limit: pageSize,
    category_id: selectedCategory === "all" ? undefined : selectedCategory,
    search: debouncedSearch || undefined,
  });

  const products = productsData?.data ?? [];
  const meta = productsData?.meta ?? {
    total: 0,
    page: 1,
    limit: pageSize,
    totalPages: 0,
  };
  const totalPages = meta.totalPages;

  const { data: categories = [], isLoading: isLoadingCategories } =
    useCategories();

  // --- Scroll shadow effect
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftShadow(scrollLeft > 0);
    setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 1);
  };

  // Scroll functions for arrow buttons
  const scrollCategoriesLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -200,
        behavior: "smooth",
      });
    }
  };

  const scrollCategoriesRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 200,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    handleScroll();
  }, [categories]);

  // Reset halaman saat filter berubah
  useEffect(() => {
    setPage(1);
  }, [selectedCategory]);

  // --- Auto-focus ke input
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // --- Tambahkan ke keranjang
  const addToCart = (product: Product) => {
    if (product.is_plu_enabled) {
      setSelectedPLUProduct(product);
      setIsPLUModalOpen(true);
      return;
    }

    // Normal product (non-PLU)
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.id === product.id && !item.locked
      );
      if (existing) {
        return prev.map((item) =>
          item.id === product.id && !item.locked
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });

    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  // --- Handle PLU product selection
  const handlePLUSelect = (weight: number, price: number, locked: boolean) => {
    if (!selectedPLUProduct) return;

    setCart((prev) => [
      ...prev,
      {
        ...selectedPLUProduct,
        quantity: 1,
        locked,
        pluWeight: weight,
        actualPrice: price,
        price: price,
      },
    ]);

    setSelectedPLUProduct(null);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  // --- Enter untuk scan barcode / buka modal
  const handleSearchKeyDown = async (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      if (searchQuery.trim()) {
        try {
          const response = await fetch(
            `${API_CONFIG.BASE_URL}${API_ENDPOINTS.PRODUCTS}?search=${searchQuery}&limit=1`
          );
          const result = await response.json();

          if (result.data && result.data.length > 0) {
            const product = result.data[0];
            if (
              product.barcode &&
              product.barcode.toLowerCase() === searchQuery.toLowerCase()
            ) {
              addToCart(product);
              setSearchQuery("");
            } else {
              toast.error("Produk tidak ditemukan!", {
                icon: <XCircle className="w-5 h-5" />,
                style: {
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                },
              });
            }
          } else {
            toast.error("Produk tidak ditemukan!", {
              icon: <XCircle className="w-5 h-5" />,
              style: { background: "#ef4444", color: "white", border: "none" },
            });
          }
        } catch (error) {
          toast.error("Gagal mencari produk", {
            icon: <XCircle className="w-5 h-5" />,
            style: { background: "#ef4444", color: "white", border: "none" },
          });
        }
      } else if (cart.length > 0) {
        setIsPaymentModalOpen(true);
      }
    }
  };

  // --- Update jumlah produk
  const updateQuantity = (id: number, delta: number, pluWeight?: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          const isMatch =
            pluWeight !== undefined
              ? item.id === id && item.pluWeight === pluWeight
              : item.id === id && !item.pluWeight;

          if (isMatch) {
            if (item.locked && delta > 0) {
              return item;
            }
            return { ...item, quantity: Math.max(0, item.quantity + delta) };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  // --- Hapus item dari cart
  const removeFromCart = (id: number, pluWeight?: number) => {
    setCart((prev) =>
      prev.filter((item) => {
        // Match by id and pluWeight
        const isMatch =
          pluWeight !== undefined
            ? item.id === id && item.pluWeight === pluWeight
            : item.id === id && !item.pluWeight;
        return !isMatch;
      })
    );
  };

  // --- Hitung total
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const totalDiscount = 0;
  const finalTotal = subtotal - totalDiscount;

  // --- Selesai pembayaran
  const handlePaymentComplete = async (data: {
    customerName: string;
    paymentMethod: "cash" | "credit";
    amountPaid: number;
  }) => {
    const cashReceived = data.paymentMethod === "cash" ? data.amountPaid : 0;
    const changeAmount =
      data.paymentMethod === "cash"
        ? Math.max(0, data.amountPaid - finalTotal)
        : 0;

    // Set status: tunai = paid, bon = pending
    const transactionStatus =
      data.paymentMethod === "cash" ? "paid" : "pending";

    try {
      const payload: CreateTransactionData = {
        transaction_number: orderNumber,
        name: data.customerName,
        payment_method_id: data.paymentMethod === "cash" ? 1 : 2,
        total: Math.round(finalTotal),
        cash_received: Math.round(cashReceived),
        change_amount: Math.round(changeAmount),
        status: transactionStatus,
        items: cart.map((item) => ({
          product_id: item.id,
          product_name_snapshot: item.name,
          quantity: item.quantity,
          price: Math.round(item.price),
          subtotal: Math.round(item.price * item.quantity),
          cost_price: Math.round(item.price),
          total_profit: 0,
        })),
      };

      await transactionsApi.create(payload);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["products"] }),
      ]);

      toast.success("Transaksi berhasil!", {
        icon: <CheckCircle className="w-5 h-5" />,
        style: { background: "#10b981", color: "white", border: "none" },
      });

      // Auto-print receipt - Temporarily Disabled
      // try {
      //   await printReceipt(data, orderNumber, cashReceived, changeAmount);
      // } catch (error) {
      //   console.error("Print error:", error);
      //   // Don't block the flow if print fails
      //   toast.error("Gagal print struk, tapi transaksi tersimpan", {
      //     icon: <XCircle className="w-5 h-5" />,
      //   });
      // }
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan transaksi", {
        icon: <XCircle className="w-5 h-5" />,
        style: { background: "#ef4444", color: "white", border: "none" },
      });
    }

    setIsPaymentModalOpen(false);
    setCart([]);
    setTimeout(() => searchInputRef.current?.focus(), 300);
  };

  // --- Print Receipt
  const printReceipt = async (
    paymentData: {
      customerName: string;
      paymentMethod: "cash" | "credit";
      amountPaid: number;
    },
    transactionNumber: string,
    cashReceived: number,
    changeAmount: number
  ) => {
    try {
      const settingsResponse = await fetch(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.SETTINGS}`
      );
      const settingsResult = await settingsResponse.json();

      if (settingsResult.status !== "success") {
        throw new Error("Failed to fetch settings");
      }

      const settings = settingsResult.data;

      const user = localStorage.getItem("user");
      const userName = user ? JSON.parse(user).name : "Kasir";

      const now = new Date();
      const receiptData: ReceiptData = {
        storeName: settings.name,
        storeAddress: settings.address,
        storePhone: settings.phone,
        transactionNumber: transactionNumber,
        date: now.toLocaleDateString("id-ID", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }),
        time: now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        cashier: userName,
        customerName: paymentData.customerName,
        items: cart.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity,
        })),
        totalQty: cart.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: subtotal,
        total: finalTotal,
        amountPaid: cashReceived,
        change: changeAmount,
        paymentMethod: paymentData.paymentMethod === "cash" ? "Cash" : "Bon",
      };

      // Print based on settings
      if (settings.print_via_bluetooth === 1) {
        await PrinterService.printViaBluetooth(receiptData);
        toast.success("Struk berhasil dicetak via Bluetooth");
      } else {
        await PrinterService.printViaLocal(
          receiptData,
          settings.name_printer_local || ""
        );
        toast.success("Struk berhasil dicetak");
      }
    } catch (error) {
      console.error("Print receipt error:", error);
      throw error;
    }
  };

  // --- UI Rendering
  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4 p-4">
      {/* Produk */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <Card className="p-4">
          <div className="relative mb-4">
            {showLeftShadow && (
              <>
                <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-card via-card/80 to-transparent z-10 pointer-events-none" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-card border shadow-md hover:bg-accent"
                  onClick={scrollCategoriesLeft}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </>
            )}

            {showRightShadow && (
              <>
                <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-card via-card/80 to-transparent z-10 pointer-events-none" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-card border shadow-md hover:bg-accent"
                  onClick={scrollCategoriesRight}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}

            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide scroll-smooth px-8"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <Button
                variant={selectedCategory === "all" ? "default" : "secondary"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
                className="whitespace-nowrap flex-shrink-0"
              >
                Semua Produk
              </Button>

              {isLoadingCategories ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memuat kategori...
                </div>
              ) : (
                categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={
                      selectedCategory === category.id ? "default" : "secondary"
                    }
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="whitespace-nowrap flex-shrink-0"
                  >
                    {category.name}
                  </Button>
                ))
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              ref={searchInputRef}
              placeholder="Cari produk atau scan barcode..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="pl-10"
              autoComplete="off"
            />
          </div>
        </Card>

        {/* Grid produk */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">
                Memuat produk...
              </span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-center">
              <p className="text-destructive mb-2">Gagal memuat produk</p>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
                <span className="text-4xl">📦</span>
              </div>
              <p className="text-lg font-semibold mb-2">
                Produk tidak tersedia
              </p>
              <p className="text-sm text-muted-foreground">
                {debouncedSearch
                  ? `Tidak ditemukan produk dengan "${debouncedSearch}"`
                  : "Belum ada produk"}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    name={product.name}
                    price={product.price}
                    onAdd={() => addToCart(product)}
                    isPluEnabled={product.is_plu_enabled}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="border-t bg-card">
                  <div className="flex flex-col gap-3 p-4">
                    {/* Info produk */}
                    <div className="text-sm text-muted-foreground text-center">
                      Menampilkan {(meta.page - 1) * meta.limit + 1} -{" "}
                      {Math.min(meta.page * meta.limit, meta.total)} dari{" "}
                      {meta.total} produk
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        disabled={page === 1}
                        className="gap-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Prev
                      </Button>

                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter((pageNum) => {
                            return (
                              pageNum === 1 ||
                              pageNum === totalPages ||
                              Math.abs(pageNum - page) <= 1
                            );
                          })
                          .map((pageNum, index, array) => (
                            <>
                              {index > 0 &&
                                array[index - 1] !== pageNum - 1 && (
                                  <span
                                    key={`ellipsis-${pageNum}`}
                                    className="px-2 text-muted-foreground"
                                  >
                                    ...
                                  </span>
                                )}
                              <Button
                                key={pageNum}
                                variant={
                                  page === pageNum ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => setPage(pageNum)}
                                className="w-9"
                              >
                                {pageNum}
                              </Button>
                            </>
                          ))}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPage((prev) => Math.min(totalPages, prev + 1))
                        }
                        disabled={page === totalPages}
                        className="gap-1"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Keranjang */}
      <Card className="w-full md:w-96 flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg">Order #{orderNumber}</h2>
          <p className="text-sm text-muted-foreground">{cart.length} item</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
                <span className="text-4xl">🛒</span>
              </div>
              <p className="text-muted-foreground">Keranjang masih kosong</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item, index) => (
                <CartItem
                  key={`${item.id}-${item.pluWeight || "normal"}-${index}`}
                  name={item.name}
                  price={item.price}
                  quantity={item.quantity}
                  onIncrease={() => updateQuantity(item.id, 1, item.pluWeight)}
                  onDecrease={() => updateQuantity(item.id, -1, item.pluWeight)}
                  onRemove={() => removeFromCart(item.id, item.pluWeight)}
                  locked={item.locked}
                  pluWeight={item.pluWeight}
                />
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-dashed space-y-3">
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between pb-2 border-b border-dashed border-border">
              <span className="text-muted-foreground">Sub Total</span>
              <span className="font-medium">
                Rp {subtotal.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 pb-3 border-t-2 border-dashed border-border">
            <span className="font-bold text-base">TOTAL AKHIR</span>
            <span className="text-2xl font-bold text-primary">
              Rp {finalTotal.toLocaleString("id-ID")}
            </span>
          </div>

          <Button
            variant="cta"
            size="lg"
            className="w-full text-lg h-12"
            disabled={cart.length === 0}
            onClick={() => setIsPaymentModalOpen(true)}
          >
            PROSES
          </Button>
        </div>
      </Card>

      {/* Modal pembayaran */}
      <PaymentModal
        open={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        total={finalTotal}
        orderNumber={orderNumber}
        onComplete={handlePaymentComplete}
      />

      {/* Modal PLU */}
      {selectedPLUProduct && (
        <PLUModal
          open={isPLUModalOpen}
          onClose={() => {
            setIsPLUModalOpen(false);
            setSelectedPLUProduct(null);
          }}
          productName={selectedPLUProduct.name}
          basePrice={selectedPLUProduct.price}
          onSelect={handlePLUSelect}
        />
      )}
    </div>
  );
};

export default POSPage;

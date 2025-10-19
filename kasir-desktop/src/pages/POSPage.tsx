import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Pause,
  List,
  Trash2,
  Play,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { useProducts } from "@/features/products/hooks/useProducts";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { useBootstrap } from "@/hooks/useBootstrap";
import { CreateTransactionData } from "@/features/transactions/services/api";
import { transactionsWrapper } from "@/services/transactions-wrapper";
import { API_CONFIG, API_ENDPOINTS } from "@/config/api";

import { ProductCard, CartItem, PLUModal } from "@/features/pos";
import { Product } from "@/features/products/types";
import { PrinterService, ReceiptData } from "@/services/printer";
import { lazy, Suspense } from "react";

// LAZY LOAD HEAVY COMPONENTS (Modal dengan animasi & logic berat)
const PaymentModal = lazy(() =>
  import("@/features/pos/components/PaymentModal").then((module) => ({
    default: module.PaymentModal,
  }))
);
type CartItemType = Product & {
  quantity: number;
  locked?: boolean;
  pluWeight?: number;
  actualPrice?: number;
};

type HeldTransaction = {
  id: string;
  timestamp: number;
  customerName?: string;
  cart: CartItemType[];
  total: number;
};

const AUTOSAVE_KEY = "pos_autosave_cart";
const HELD_TRANSACTIONS_KEY = "pos_held_transactions";

const POSPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<number | "all">("all");
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Separate search states for barcode and product name
  const [barcodeQuery, setBarcodeQuery] = useState("");
  const [productNameQuery, setProductNameQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Separate refs for barcode and product name inputs
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const productNameInputRef = useRef<HTMLInputElement>(null);

  // Barcode scanner detection
  const barcodeBufferRef = useRef<string>("");
  const barcodeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [cart, setCart] = useState<CartItemType[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPLUModalOpen, setIsPLUModalOpen] = useState(false);
  const [selectedPLUProduct, setSelectedPLUProduct] = useState<Product | null>(null);

  // Hold Transaction states
  const [heldTransactions, setHeldTransactions] = useState<HeldTransaction[]>([]);
  const [isHeldListOpen, setIsHeldListOpen] = useState(false);
  const [isRestoringCart, setIsRestoringCart] = useState(false);

  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const pageSize = 10; // 10 produk per halaman untuk performa optimal

  const orderNumber = `TRX-${Date.now().toString().slice(-6)}`;

  // Debounce for product name search only
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(productNameQuery);
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [productNameQuery]);

  // Products data - always use pagination
  const {
    data: productsData,
    isLoading: isProductsLoading,
    error: productsError,
  } = useProducts({
    page,
    limit: pageSize,
    category_id: selectedCategory === "all" ? undefined : selectedCategory,
    search: debouncedSearch || undefined,
  });

  const isLoading = isProductsLoading;
  const error = productsError;

  const products = productsData?.data ?? [];
  const meta = productsData?.meta ?? { total: 0, page: 1, limit: pageSize, totalPages: 0 };
  const totalPages = meta.totalPages;

  // Bootstrap data - untuk categories only (cached)
  const { data: bootstrapData, isLoading: isBootstrapLoading } = useBootstrap();

  // Categories from bootstrap (cached 10 min)
  const categories = bootstrapData?.categories ?? [];
  const isLoadingCategories = isBootstrapLoading;

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

  // --- Auto-focus ke barcode input saat pertama kali load/refresh
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // --- Load held transactions dari localStorage saat mount
  useEffect(() => {
    const savedHeldTransactions = localStorage.getItem(HELD_TRANSACTIONS_KEY);
    if (savedHeldTransactions) {
      try {
        const parsed = JSON.parse(savedHeldTransactions);
        setHeldTransactions(parsed);
      } catch (error) {
        console.error("Failed to load held transactions:", error);
      }
    }
  }, []);

  // --- Save held transactions ke localStorage saat ada perubahan
  useEffect(() => {
    if (heldTransactions.length > 0) {
      localStorage.setItem(HELD_TRANSACTIONS_KEY, JSON.stringify(heldTransactions));
    } else {
      localStorage.removeItem(HELD_TRANSACTIONS_KEY);
    }
  }, [heldTransactions]);

  // --- Auto-restore cart dari localStorage saat mount
  useEffect(() => {
    const savedCart = localStorage.getItem(AUTOSAVE_KEY);
    if (savedCart && !isRestoringCart) {
      try {
        const parsed = JSON.parse(savedCart);
        if (parsed && parsed.length > 0) {
          setCart(parsed);
          setIsRestoringCart(true);
          toast.success(`Cart dipulihkan (${parsed.length} item)`, {
            icon: <CheckCircle className="w-5 h-5" />,
            style: { background: "#10b981", color: "white", border: "none" },
            duration: 3000,
          });
        }
      } catch (error) {
        console.error("Failed to restore cart:", error);
        localStorage.removeItem(AUTOSAVE_KEY);
      }
    }
  }, []);

  // --- Auto-save cart setiap 10 detik
  useEffect(() => {
    if (cart.length === 0) {
      localStorage.removeItem(AUTOSAVE_KEY);
      return;
    }

    const autoSaveTimer = setInterval(() => {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(cart));
    }, 10000); // 10 seconds

    return () => clearInterval(autoSaveTimer);
  }, [cart]);

  // --- Keyboard shortcuts untuk switch antara barcode dan product name search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F1 untuk focus ke barcode input
      if (e.key === "F1") {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      }
      // F2 untuk focus ke product name input
      if (e.key === "F2") {
        e.preventDefault();
        productNameInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // --- Cleanup barcode timer on unmount
  useEffect(() => {
    return () => {
      if (barcodeTimerRef.current) {
        clearTimeout(barcodeTimerRef.current);
      }
    };
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
      const existing = prev.find((item) => item.id === product.id && !item.locked);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id && !item.locked ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });

    // Auto focus back to barcode input after adding
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 50);
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
    // Auto focus back to barcode input after PLU selection
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 50);
  };

  // --- Process barcode scan
  const processBarcodeScans = async (barcode: string) => {
    if (!barcode.trim()) return;

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.PRODUCTS}?search=${barcode}&limit=1`
      );
      const result = await response.json();

      if (result.data && result.data.length > 0) {
        const product = result.data[0];
        if (product.barcode && product.barcode.toLowerCase() === barcode.toLowerCase()) {
          addToCart(product);
          setBarcodeQuery("");
        } else {
          toast.error("Barcode tidak ditemukan!", {
            icon: <XCircle className="w-5 h-5" />,
            style: {
              background: "#ef4444",
              color: "white",
              border: "none",
            },
          });
          setBarcodeQuery("");
        }
      } else {
        toast.error("Barcode tidak ditemukan!", {
          icon: <XCircle className="w-5 h-5" />,
          style: { background: "#ef4444", color: "white", border: "none" },
        });
        setBarcodeQuery("");
      }
    } catch (error) {
      toast.error("Gagal mencari produk", {
        icon: <XCircle className="w-5 h-5" />,
        style: { background: "#ef4444", color: "white", border: "none" },
      });
      setBarcodeQuery("");
    }
  };

  // --- Handle barcode input change with auto-submit
  const handleBarcodeChange = (value: string) => {
    setBarcodeQuery(value);

    // Clear previous timer
    if (barcodeTimerRef.current) {
      clearTimeout(barcodeTimerRef.current);
    }

    // Auto-submit after 200ms of no input (barcode scanner is done)
    if (value.trim().length > 0) {
      barcodeTimerRef.current = setTimeout(() => {
        processBarcodeScans(value);
      }, 200);
    }
  };

  // --- Handle Enter key on barcode input (for manual input or payment modal)
  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();

      // Clear timer to prevent double submission
      if (barcodeTimerRef.current) {
        clearTimeout(barcodeTimerRef.current);
      }

      if (barcodeQuery.trim()) {
        // Manual submit if user presses Enter
        processBarcodeScans(barcodeQuery);
      } else if (cart.length > 0) {
        // Jika barcode kosong dan ada item di cart, buka modal pembayaran
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

    // Auto focus back to barcode input after updating quantity
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 50);
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

    // Auto focus back to barcode input after removing item
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 50);
  };

  // --- Hitung total
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
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
      data.paymentMethod === "cash" ? Math.max(0, data.amountPaid - finalTotal) : 0;

    // Set status: tunai = paid, bon = pending
    const transactionStatus = data.paymentMethod === "cash" ? "paid" : "pending";

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

      await transactionsWrapper.create(payload);

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

    // Clear cart and close modal
    setCart([]);
    setIsPaymentModalOpen(false);

    // Clear autosave after successful payment
    localStorage.removeItem(AUTOSAVE_KEY);

    // Auto focus back to barcode input after payment
    setTimeout(() => barcodeInputRef.current?.focus(), 150);
  };

  // --- Hold Transaction Functions
  const handleHoldTransaction = () => {
    if (cart.length === 0) {
      toast.error("Keranjang kosong!", {
        icon: <XCircle className="w-5 h-5" />,
        style: { background: "#ef4444", color: "white", border: "none" },
      });
      return;
    }

    const heldTransaction: HeldTransaction = {
      id: `HOLD-${Date.now()}`,
      timestamp: Date.now(),
      cart: [...cart],
      total: finalTotal,
    };

    setHeldTransactions((prev) => [...prev, heldTransaction]);
    setCart([]);
    localStorage.removeItem(AUTOSAVE_KEY);

    toast.success("Transaksi di-hold!", {
      icon: <CheckCircle className="w-5 h-5" />,
      style: { background: "#10b981", color: "white", border: "none" },
    });

    setTimeout(() => barcodeInputRef.current?.focus(), 50);
  };

  const handleResumeTransaction = (transaction: HeldTransaction) => {
    if (cart.length > 0) {
      toast.error("Selesaikan transaksi saat ini terlebih dahulu!", {
        icon: <XCircle className="w-5 h-5" />,
        style: { background: "#ef4444", color: "white", border: "none" },
      });
      return;
    }

    setCart(transaction.cart);
    setHeldTransactions((prev) => prev.filter((t) => t.id !== transaction.id));
    setIsHeldListOpen(false);

    toast.success("Transaksi di-resume!", {
      icon: <CheckCircle className="w-5 h-5" />,
      style: { background: "#10b981", color: "white", border: "none" },
    });

    setTimeout(() => barcodeInputRef.current?.focus(), 50);
  };

  const handleDeleteHeldTransaction = (transactionId: string) => {
    setHeldTransactions((prev) => prev.filter((t) => t.id !== transactionId));

    toast.success("Transaksi dihapus!", {
      icon: <CheckCircle className="w-5 h-5" />,
      style: { background: "#10b981", color: "white", border: "none" },
    });
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
      const settingsResponse = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.SETTINGS}`);
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
        await PrinterService.printViaLocal(receiptData, settings.name_printer_local || "");
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
                    variant={selectedCategory === category.id ? "default" : "secondary"}
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

          {/* Search Bars - Barcode and Product Name */}
          <div className="grid grid-cols-2 gap-3">
            {/* Barcode Search - Auto focus */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                ref={barcodeInputRef}
                placeholder="Scan Barcode..."
                value={barcodeQuery}
                onChange={(e) => handleBarcodeChange(e.target.value)}
                onKeyDown={handleBarcodeKeyDown}
                className="pl-10"
                autoComplete="off"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                F1
              </span>
            </div>

            {/* Product Name Search - Manual focus */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                ref={productNameInputRef}
                placeholder="Cari Nama Produk..."
                value={productNameQuery}
                onChange={(e) => setProductNameQuery(e.target.value)}
                className="pl-10"
                autoComplete="off"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                F2
              </span>
            </div>
          </div>
        </Card>

        {/* Grid produk */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Memuat produk...</span>
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
              <p className="text-lg font-semibold mb-2">Produk tidak tersedia</p>
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
                      {Math.min(meta.page * meta.limit, meta.total)} dari {meta.total} produk
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
                              {index > 0 && array[index - 1] !== pageNum - 1 && (
                                <span
                                  key={`ellipsis-${pageNum}`}
                                  className="px-2 text-muted-foreground"
                                >
                                  ...
                                </span>
                              )}
                              <Button
                                key={pageNum}
                                variant={page === pageNum ? "default" : "outline"}
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
                        onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
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
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="font-semibold text-lg">Order #{orderNumber}</h2>
              <p className="text-sm text-muted-foreground">{cart.length} item</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsHeldListOpen(true)}
              className="relative"
            >
              <List className="w-4 h-4 mr-1" />
              Hold
              {heldTransactions.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  {heldTransactions.length}
                </span>
              )}
            </Button>
          </div>
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
              <span className="font-medium">Rp {subtotal.toLocaleString("id-ID")}</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 pb-3 border-t-2 border-dashed border-border">
            <span className="font-bold text-base">TOTAL AKHIR</span>
            <span className="text-2xl font-bold text-primary">
              Rp {finalTotal.toLocaleString("id-ID")}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="lg"
              className="h-12"
              disabled={cart.length === 0}
              onClick={handleHoldTransaction}
            >
              <Pause className="w-4 h-4 mr-1" />
              HOLD
            </Button>
            <Button
              variant="cta"
              size="lg"
              className="col-span-2 text-lg h-12"
              disabled={cart.length === 0}
              onClick={() => setIsPaymentModalOpen(true)}
            >
              PROSES
            </Button>
          </div>
        </div>
      </Card>

      {/* Modal pembayaran - Lazy Loaded */}
      {isPaymentModalOpen && (
        <Suspense fallback={<div />}>
          <PaymentModal
            open={isPaymentModalOpen}
            onClose={() => {
              setIsPaymentModalOpen(false);
              // Auto focus back to barcode input when payment modal is closed without completing
              setTimeout(() => {
                barcodeInputRef.current?.focus();
              }, 50);
            }}
            total={finalTotal}
            orderNumber={orderNumber}
            cartItems={cart}
            onComplete={handlePaymentComplete}
          />
        </Suspense>
      )}

      {/* Modal PLU */}
      {selectedPLUProduct && (
        <PLUModal
          open={isPLUModalOpen}
          onClose={() => {
            setIsPLUModalOpen(false);
            setSelectedPLUProduct(null);
            // Auto focus back to barcode input when PLU modal is closed without selection
            setTimeout(() => {
              barcodeInputRef.current?.focus();
            }, 50);
          }}
          productName={selectedPLUProduct.name}
          basePrice={selectedPLUProduct.price}
          onSelect={handlePLUSelect}
        />
      )}

      {/* Modal Held Transactions List */}
      <Dialog open={isHeldListOpen} onOpenChange={setIsHeldListOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <List className="w-5 h-5" />
              Transaksi Di-Hold ({heldTransactions.length})
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[60vh]">
            {heldTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <Pause className="w-10 h-10 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">Tidak ada transaksi yang di-hold</p>
              </div>
            ) : (
              <div className="space-y-3">
                {heldTransactions.map((transaction) => (
                  <Card key={transaction.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {new Date(transaction.timestamp).toLocaleString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="font-semibold">
                          {transaction.cart.length} item • Rp{" "}
                          {transaction.total.toLocaleString("id-ID")}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleResumeTransaction(transaction)}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Resume
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteHeldTransaction(transaction.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1 text-sm">
                      {transaction.cart.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex justify-between text-muted-foreground">
                          <span className="truncate flex-1">
                            {item.quantity}x {item.name}
                          </span>
                          <span>Rp {(item.price * item.quantity).toLocaleString("id-ID")}</span>
                        </div>
                      ))}
                      {transaction.cart.length > 3 && (
                        <p className="text-xs text-muted-foreground italic">
                          +{transaction.cart.length - 3} item lainnya
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default POSPage;

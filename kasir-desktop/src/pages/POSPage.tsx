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
import { ProductCard, CartItem, PLUModal, PaymentSuccessModal } from "@/features/pos";
import { Product } from "@/features/products/types";
import { PrinterService, ReceiptData } from "@/services/printer";
import { lazy, Suspense } from "react";
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
  const [barcodeQuery, setBarcodeQuery] = useState("");
  const [productNameQuery, setProductNameQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const productNameInputRef = useRef<HTMLInputElement>(null);
  const barcodeBufferRef = useRef<string>("");
  const barcodeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [cart, setCart] = useState<CartItemType[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPLUModalOpen, setIsPLUModalOpen] = useState(false);
  const [selectedPLUProduct, setSelectedPLUProduct] = useState<Product | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successPaymentData, setSuccessPaymentData] = useState<{
    amount: number;
    orderId: string;
    paymentMethod: string;
    paymentTime: string;
    customerName: string;
    cashReceived: number;
    changeAmount: number;
    cartItems: CartItemType[];
  } | null>(null);
  const [heldTransactions, setHeldTransactions] = useState<HeldTransaction[]>([]);
  const [isHeldListOpen, setIsHeldListOpen] = useState(false);
  const [isRestoringCart, setIsRestoringCart] = useState(false);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const pageSize = 10; // 10 produk per halaman untuk performa optimal
  const orderNumber = `TRX-${Date.now().toString().slice(-6)}`;
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(productNameQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [productNameQuery]);
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
  const { data: bootstrapData, isLoading: isBootstrapLoading } = useBootstrap();
  const categories = bootstrapData?.categories ?? [];
  const isLoadingCategories = isBootstrapLoading;
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftShadow(scrollLeft > 0);
    setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 1);
  };
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
  useEffect(() => {
    setPage(1);
  }, [selectedCategory]);
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);
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
  useEffect(() => {
    if (heldTransactions.length > 0) {
      localStorage.setItem(HELD_TRANSACTIONS_KEY, JSON.stringify(heldTransactions));
    } else {
      localStorage.removeItem(HELD_TRANSACTIONS_KEY);
    }
  }, [heldTransactions]);
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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      }
      if (e.key === "F2") {
        e.preventDefault();
        productNameInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  useEffect(() => {
    return () => {
      if (barcodeTimerRef.current) {
        clearTimeout(barcodeTimerRef.current);
      }
    };
  }, []);
  const addToCart = (product: Product) => {
    if (product.is_plu_enabled) {
      setSelectedPLUProduct(product);
      setIsPLUModalOpen(true);
      return;
    }
    const currentCartItem = cart.find((item) => item.id === product.id && !item.locked);
    const currentQuantityInCart = currentCartItem?.quantity || 0;
    const availableStock = product.stock || 0;
    if (currentQuantityInCart >= availableStock) {
      toast.error(`Stok tidak mencukupi! Stok tersedia: ${availableStock}`, {
        icon: <XCircle className="w-5 h-5" />,
        style: { background: "#ef4444", color: "white", border: "none" },
        duration: 3000,
      });
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 50);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id && !item.locked);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id && !item.locked ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 50);
  };
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
      barcodeInputRef.current?.focus();
    }, 50);
  };
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
          return;
        }
      }
      toast.error("Barcode tidak ditemukan!", {
        icon: <XCircle className="w-5 h-5" />,
        style: { background: "#ef4444", color: "white", border: "none" },
      });
      setBarcodeQuery("");
    } catch (error) {

      if (typeof window !== "undefined" && window.electronAPI?.isElectron) {
        try {
          const { productService } = await import("@/services/electron-db");
          const product = await productService.getByBarcode(barcode);
          if (product) {

            addToCart(product as any);
            setBarcodeQuery("");
            return;
          }
          toast.error("Barcode tidak ditemukan!", {
            icon: <XCircle className="w-5 h-5" />,
            style: { background: "#ef4444", color: "white", border: "none" },
          });
          setBarcodeQuery("");
        } catch (dbError) {
          console.error("❌ SQLite search failed:", dbError);
          toast.error("Gagal mencari produk", {
            icon: <XCircle className="w-5 h-5" />,
            style: { background: "#ef4444", color: "white", border: "none" },
          });
          setBarcodeQuery("");
        }
      } else {
        toast.error("Gagal mencari produk (offline)", {
          icon: <XCircle className="w-5 h-5" />,
          style: { background: "#ef4444", color: "white", border: "none" },
        });
        setBarcodeQuery("");
      }
    }
  };
  const handleBarcodeChange = (value: string) => {
    setBarcodeQuery(value);
    if (barcodeTimerRef.current) {
      clearTimeout(barcodeTimerRef.current);
    }
    if (value.trim().length > 0) {
      barcodeTimerRef.current = setTimeout(() => {
        processBarcodeScans(value);
      }, 200);
    }
  };
  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (barcodeTimerRef.current) {
        clearTimeout(barcodeTimerRef.current);
      }
      if (barcodeQuery.trim()) {
        processBarcodeScans(barcodeQuery);
      } else if (cart.length > 0) {
        setIsPaymentModalOpen(true);
      }
    }
  };
  const updateQuantity = (id: number, delta: number, pluWeight?: number) => {
    if (delta > 0) {
      const item = cart.find((i) =>
        pluWeight !== undefined
          ? i.id === id && i.pluWeight === pluWeight
          : i.id === id && !i.pluWeight
      );
      if (item) {
        const availableStock = item.stock || 0;
        const newQuantity = item.quantity + delta;
        if (newQuantity > availableStock) {
          toast.error(`Stok tidak mencukupi! Stok tersedia: ${availableStock}`, {
            icon: <XCircle className="w-5 h-5" />,
            style: { background: "#ef4444", color: "white", border: "none" },
            duration: 3000,
          });
          setTimeout(() => {
            barcodeInputRef.current?.focus();
          }, 50);
          return;
        }
      }
    }
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
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 50);
  };
  const removeFromCart = (id: number, pluWeight?: number) => {
    setCart((prev) =>
      prev.filter((item) => {
        const isMatch =
          pluWeight !== undefined
            ? item.id === id && item.pluWeight === pluWeight
            : item.id === id && !item.pluWeight;
        return !isMatch;
      })
    );
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 50);
  };
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalDiscount = 0;
  const finalTotal = subtotal - totalDiscount;
  const handlePaymentComplete = async (data: {
    customerName: string;
    paymentMethod: "cash" | "credit";
    amountPaid: number;
  }) => {
    const cashReceived = data.paymentMethod === "cash" ? data.amountPaid : 0;
    const changeAmount =
      data.paymentMethod === "cash" ? Math.max(0, data.amountPaid - finalTotal) : 0;
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
          product_id: item.uuid || item.id, // Use UUID (server ID) for sync compatibility
          product_name_snapshot: item.name,
          quantity: item.quantity,
          price: Math.round(item.price),
          subtotal: Math.round(item.price * item.quantity),
          cost_price: Math.round(item.price),
          total_profit: 0,
        })),
      };
      await transactionsWrapper.create(payload);
      if (typeof window !== "undefined" && window.electronAPI?.isElectron) {
        try {
          const { productService } = await import("@/services/electron-db");
          for (const item of cart) {
            console.log(`📉 Decreasing stock for ${item.name} (ID: ${item.id}) by ${item.quantity}`);
            await productService.decreaseStock(item.id, item.quantity);
          }

        } catch (stockError) {
          console.error("❌ Failed to update stock locally:", stockError);
        }
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["products"] }),
      ]);
      const now = new Date();
      const paymentTime = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const cartSnapshot = [...cart];
      setSuccessPaymentData({
        amount: finalTotal,
        orderId: orderNumber,
        paymentMethod: data.paymentMethod === "cash" ? "Tunai" : "Bon",
        paymentTime: paymentTime,
        customerName: data.customerName,
        cashReceived: cashReceived,
        changeAmount: changeAmount,
        cartItems: cartSnapshot,
      });
      setIsPaymentModalOpen(false);
      setIsSuccessModalOpen(true);
      setCart([]);
      localStorage.removeItem(AUTOSAVE_KEY);
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan transaksi", {
        icon: <XCircle className="w-5 h-5" />,
        style: { background: "#ef4444", color: "white", border: "none" },
      });
    }
  };
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
  const handleSuccessModalClose = () => {
    setIsSuccessModalOpen(false);
    setSuccessPaymentData(null);
    setTimeout(() => barcodeInputRef.current?.focus(), 150);
  };
  const handlePrintFromSuccessModal = async () => {
    if (!successPaymentData) return;
    try {
      toast.info("Mencetak struk...", {
        icon: <Printer className="w-5 h-5" />,
        duration: 2000,
      });
      const cartData = successPaymentData.cartItems;
      if (cartData.length === 0) {
        toast.warning("Data cart tidak tersedia untuk print.", {
          icon: <XCircle className="w-5 h-5" />,
          duration: 3000,
        });
        return;
      }
      const user = localStorage.getItem("user");
      const userName = user ? JSON.parse(user).name : "Kasir";
      const now = new Date();
      const receiptData: ReceiptData = {
        storeName: "DILLA CELL", // Hardcoded (used for reference only)
        storeAddress: "Ngestikarya, waway karya, lampung timur", // Hardcoded
        storePhone: "088287013223", // Hardcoded
        transactionNumber: successPaymentData.orderId,
        date: now.toLocaleDateString("id-ID", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }),
        time: successPaymentData.paymentTime,
        cashier: userName,
        customerName: successPaymentData.customerName,
        items: cartData.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity,
        })),
        totalQty: cartData.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: successPaymentData.amount,
        total: successPaymentData.amount,
        amountPaid: successPaymentData.cashReceived,
        change: successPaymentData.changeAmount,
        paymentMethod: successPaymentData.paymentMethod,
      };
      let printViaBluetooth = false;
      let printerName = "";
      try {
        const settingsResponse = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.SETTINGS}`, {
          signal: AbortSignal.timeout(3000), // 3 second timeout
        });
        const settingsResult = await settingsResponse.json();
        if (settingsResult.status === "success") {
          const settings = settingsResult.data;
          printViaBluetooth = settings.print_via_bluetooth === 1;
          printerName = settings.name_printer_local || "";
        }
      } catch (settingsError) {

        printViaBluetooth = false;
        printerName = "";
      }
      if (printViaBluetooth) {
        await PrinterService.printViaBluetooth(receiptData);
        toast.success("Struk berhasil dicetak via Bluetooth", {
          icon: <CheckCircle className="w-5 h-5" />,
          style: { background: "#10b981", color: "white", border: "none" },
        });
      } else {
        await PrinterService.printViaLocal(receiptData, printerName);
        toast.success("Struk berhasil dicetak", {
          icon: <CheckCircle className="w-5 h-5" />,
          style: { background: "#10b981", color: "white", border: "none" },
        });
      }
    } catch (error) {
      console.error("Print receipt error:", error);
      toast.error("Gagal print struk: " + (error as Error).message, {
        icon: <XCircle className="w-5 h-5" />,
        style: { background: "#ef4444", color: "white", border: "none" },
      });
    }
  };
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
                    stock={product.stock}
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
            setTimeout(() => {
              barcodeInputRef.current?.focus();
            }, 50);
          }}
          productName={selectedPLUProduct.name}
          basePrice={selectedPLUProduct.price}
          onSelect={handlePLUSelect}
        />
      )}
      {/* Modal Payment Success */}
      {successPaymentData && (
        <PaymentSuccessModal
          open={isSuccessModalOpen}
          onClose={handleSuccessModalClose}
          amount={successPaymentData.amount}
          orderId={successPaymentData.orderId}
          paymentMethod={successPaymentData.paymentMethod}
          paymentTime={successPaymentData.paymentTime}
          onNewOrder={handleSuccessModalClose}
          onPrintReceipt={handlePrintFromSuccessModal}
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

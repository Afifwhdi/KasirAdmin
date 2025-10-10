import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

// Feature imports
import { useProducts, Product } from "@/features/products";
import { useCategories } from "@/features/categories";
import {
  CartItem as CartItemType,
  transactionsApi,
  CreateTransactionData,
} from "@/features/transactions";
import { ProductCard, CartItem, PaymentModal } from "@/features/pos";

const POSPage = () => {
  const { data: products = [], isLoading, error } = useProducts();
  const { data: categories = [], isLoading: isLoadingCategories } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<number | "all">("all");
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [cart, setCart] = useState<CartItemType[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const orderNumber = `TRX-${Date.now().toString().slice(-6)}`;

  // Handle scroll shadow effect
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftShadow(scrollLeft > 0);
    setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    handleScroll();
  }, [categories]);

  // Auto-focus to search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "all" ||
      product.category_id === selectedCategory;
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    
    // Auto-focus back to search after adding to cart
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  // Handle barcode scan from search input
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    // If value looks like barcode (typically longer and might contain only numbers)
    // Search for product by barcode
    if (value.length > 0) {
      const productByBarcode = products.find(p => 
        p.barcode && p.barcode.toLowerCase() === value.toLowerCase()
      );
      
      if (productByBarcode) {
        // Found product by barcode - add to cart
        addToCart(productByBarcode);
        // Clear search
        setSearchQuery("");
      }
    }
  };

  // Handle Enter key in search (for manual barcode entry or open payment modal)
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // If search has value, try to find product by barcode
      if (searchQuery.trim()) {
        const productByBarcode = products.find(p => 
          p.barcode && p.barcode.toLowerCase() === searchQuery.toLowerCase()
        );
        
        if (productByBarcode) {
          addToCart(productByBarcode);
          setSearchQuery("");
        } else {
          // Product not found
          toast.error("Produk tidak ditemukan!", {
            icon: <XCircle className="w-5 h-5" />,
            style: {
              background: '#ef4444',
              color: 'white',
              border: 'none',
            },
            duration: 3000,
          });
        }
      } else {
        // If search is empty and cart has items, open payment modal
        if (cart.length > 0) {
          setIsPaymentModalOpen(true);
        }
      }
    }
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const totalDiscount = 0;
  const finalTotal = subtotal - totalDiscount;

  const handlePaymentComplete = async (data: {
    customerName: string;
    paymentMethod: "cash" | "credit";
    amountPaid: number;
  }) => {
    const cashReceived = data.paymentMethod === "cash" ? data.amountPaid : 0;
    const changeAmount = data.paymentMethod === "cash" ? Math.max(0, data.amountPaid - finalTotal) : 0;

    try {
      const payload: CreateTransactionData = {
        transaction_number: orderNumber,
        name: data.customerName,
        payment_method_id: data.paymentMethod === "cash" ? 1 : 2,
        total: Math.round(finalTotal),
        cash_received: Math.round(cashReceived),
        change: Math.round(changeAmount),
        items: cart.map((item) => ({
          product_id: item.id,
          product_name: item.name,
          price: Math.round(item.price),
          qty: item.quantity,
          subtotal: Math.round(item.price * item.quantity),
        })),
      };

      await transactionsApi.create(payload);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["products"] }),
      ]);

      toast.success("Transaksi berhasil!", {
        icon: <CheckCircle className="w-5 h-5" />,
        style: {
          background: "#10b981",
          color: "white",
          border: "none",
        },
        duration: 3000,
      });
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan transaksi", {
        icon: <XCircle className="w-5 h-5" />,
        style: {
          background: "#ef4444",
          color: "white",
          border: "none",
        },
        duration: 3000,
      });
    }

    setIsPaymentModalOpen(false);
    setCart([]);

    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 300);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4 p-4">
      {/* Left Panel - Product Selection */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <Card className="p-4">
          <div className="relative mb-4">
            {/* Left Shadow */}
            {showLeftShadow && (
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-card to-transparent z-10 pointer-events-none" />
            )}
            
            {/* Right Shadow */}
            {showRightShadow && (
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent z-10 pointer-events-none" />
            )}
            
            {/* Categories Scroll Container */}
            <div 
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {/* All Products Button */}
              <Button
                variant={selectedCategory === "all" ? "default" : "secondary"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
                className="whitespace-nowrap flex-shrink-0"
              >
                Semua Produk
              </Button>
              
              {/* Categories from API */}
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

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">
                Memuat produk...
              </span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-destructive mb-2">Gagal memuat produk</p>
                <p className="text-sm text-muted-foreground">{error.message}</p>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
                <span className="text-4xl">📦</span>
              </div>
              <p className="text-lg font-semibold mb-2">
                Produk tidak tersedia
              </p>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? `Tidak ditemukan produk dengan "${searchQuery}"` : "Belum ada produk"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  name={product.name}
                  price={product.price}
                  onAdd={() => addToCart(product)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Cart */}
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
              {cart.map((item) => (
                <CartItem
                  key={item.id}
                  name={item.name}
                  price={item.price}
                  quantity={item.quantity}
                  onIncrease={() => updateQuantity(item.id, 1)}
                  onDecrease={() => updateQuantity(item.id, -1)}
                  onRemove={() => removeFromCart(item.id)}
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
            {totalDiscount > 0 && (
              <div className="flex justify-between pb-2 border-b border-dashed border-border text-success">
                <span>Potongan Harga</span>
                <span>- Rp {totalDiscount.toLocaleString("id-ID")}</span>
              </div>
            )}
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

      <PaymentModal
        open={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        total={finalTotal}
        orderNumber={orderNumber}
        onComplete={handlePaymentComplete}
      />
    </div>
  );
};

export default POSPage;

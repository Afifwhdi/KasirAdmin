import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Banknote, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  total: number;
  orderNumber: string;
  onComplete: (data: {
    customerName: string;
    paymentMethod: "cash" | "credit";
    amountPaid: number;
  }) => void;
}

export const PaymentModal = ({ open, onClose, total, orderNumber, onComplete }: PaymentModalProps) => {
  const [customerName, setCustomerName] = useState("Umum");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "credit">("cash");
  const [amountPaid, setAmountPaid] = useState(total);
  const [displayValue, setDisplayValue] = useState(total.toLocaleString('id-ID'));
  const amountInputRef = useRef<HTMLInputElement>(null);
  
  const change = paymentMethod === "cash" ? Math.max(0, amountPaid - total) : 0;
  const remaining = paymentMethod === "credit" ? total : 0;
  
  // Reset values and auto-focus when modal opens
  useEffect(() => {
    if (open) {
      // Reset all values
      setCustomerName("Umum");
      setPaymentMethod("cash");
      setAmountPaid(total);
      setDisplayValue(total.toLocaleString('id-ID'));
      
      // Auto-focus to amount input
      setTimeout(() => {
        amountInputRef.current?.focus();
        amountInputRef.current?.select();
      }, 150);
    }
  }, [open, total]);

  // Handle currency input change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-numeric
    const numericValue = value === '' ? 0 : parseInt(value, 10);
    setAmountPaid(numericValue);
    setDisplayValue(numericValue === 0 ? '' : numericValue.toLocaleString('id-ID'));
  };

  // Handle Enter key to submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handlePayment();
    }
  };
  
  const handlePayment = () => {
    onComplete({
      customerName,
      paymentMethod,
      amountPaid,
    });
    onClose();
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Penerimaan Pembayaran</DialogTitle>
          <p className="text-sm text-muted-foreground">No. Order: {orderNumber}</p>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          <div>
            <Label htmlFor="customer">Nama Customer</Label>
            <Input
              id="customer"
              value={customerName}
              disabled
              className="mt-1.5 bg-secondary/50"
            />
          </div>
          
          <div>
            <Label className="mb-3 block">Metode Pembayaran</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod("cash")}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all flex items-center gap-3",
                  paymentMethod === "cash"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  paymentMethod === "cash" ? "bg-primary" : "bg-secondary"
                )}>
                  <Banknote className={cn(
                    "w-5 h-5",
                    paymentMethod === "cash" ? "text-primary-foreground" : "text-foreground"
                  )} />
                </div>
                <span className="font-medium">Tunai</span>
              </button>
              
              <button
                onClick={() => setPaymentMethod("credit")}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all flex items-center gap-3",
                  paymentMethod === "credit"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  paymentMethod === "credit" ? "bg-primary" : "bg-secondary"
                )}>
                  <FileText className={cn(
                    "w-5 h-5",
                    paymentMethod === "credit" ? "text-primary-foreground" : "text-foreground"
                  )} />
                </div>
                <span className="font-medium">Bon/Piutang</span>
              </button>
            </div>
          </div>
          
          <div className="bg-secondary/50 rounded-lg p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Tagihan</span>
              <span className="text-2xl font-bold text-foreground">
                Rp {total.toLocaleString('id-ID')}
              </span>
            </div>
            
            <div>
              <Label htmlFor="amount">Jumlah Dibayar</Label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lg font-semibold text-muted-foreground">
                  Rp
                </span>
                <Input
                  ref={amountInputRef}
                  id="amount"
                  type="text"
                  value={displayValue}
                  onChange={handleAmountChange}
                  onKeyDown={handleKeyDown}
                  className="pl-12 text-lg font-semibold text-right"
                  disabled={paymentMethod === "credit"}
                  placeholder="0"
                />
              </div>
            </div>
            
            {paymentMethod === "cash" && (
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-muted-foreground">Kembalian</span>
                <span className="text-xl font-bold text-success">
                  Rp {change.toLocaleString('id-ID')}
                </span>
              </div>
            )}
            
            {paymentMethod === "credit" && (
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-muted-foreground">Sisa Tagihan</span>
                <span className="text-xl font-bold text-warning">
                  Rp {remaining.toLocaleString('id-ID')}
                </span>
              </div>
            )}
          </div>
          
          <Button 
            variant="cta" 
            size="lg" 
            className="w-full text-lg h-14"
            onClick={handlePayment}
          >
            BAYAR (Enter)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

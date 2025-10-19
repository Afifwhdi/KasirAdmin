import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface PayBonModalProps {
  open: boolean;
  onClose: () => void;
  total: number;
  customerName: string;
  transactionNumber: string;
  onComplete: (amountPaid: number) => void;
}

export const PayBonModal = ({
  open,
  onClose,
  total,
  customerName,
  transactionNumber,
  onComplete,
}: PayBonModalProps) => {
  const [amountPaid, setAmountPaid] = useState(total);
  const [displayValue, setDisplayValue] = useState(total.toLocaleString("id-ID"));
  const amountInputRef = useRef<HTMLInputElement>(null);

  const change = Math.max(0, amountPaid - total);

  // Reset values and auto-focus when modal opens
  useEffect(() => {
    if (open) {
      setAmountPaid(total);
      setDisplayValue(total.toLocaleString("id-ID"));

      // Auto-focus to amount input
      setTimeout(() => {
        amountInputRef.current?.focus();
        amountInputRef.current?.select();
      }, 150);
    }
  }, [open, total]);

  // Handle currency input change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // Remove non-numeric
    const numericValue = value === "" ? 0 : parseInt(value, 10);
    setAmountPaid(numericValue);
    setDisplayValue(numericValue === 0 ? "" : numericValue.toLocaleString("id-ID"));
  };

  // Handle Enter key to submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handlePayment();
    }
  };

  const handlePayment = () => {
    if (amountPaid < total) {
      alert("Jumlah pembayaran tidak boleh kurang dari total tagihan!");
      return;
    }
    onComplete(amountPaid);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Pembayaran BON</DialogTitle>
          <p className="text-sm text-muted-foreground">No. Transaksi: {transactionNumber}</p>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div>
            <Label htmlFor="customer">Nama Customer</Label>
            <Input
              id="customer"
              value={customerName || "Umum"}
              disabled
              className="mt-1.5 bg-secondary/50"
            />
          </div>

          <div className="bg-secondary/50 rounded-lg p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Tagihan</span>
              <span className="text-2xl font-bold text-foreground">
                Rp {total.toLocaleString("id-ID")}
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
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-muted-foreground">Kembalian</span>
              <span className="text-xl font-bold text-green-600">
                Rp {change.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="w-full" onClick={onClose}>
              Batal
            </Button>
            <Button
              variant="default"
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={handlePayment}
            >
              Konfirmasi Pembayaran (Enter)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

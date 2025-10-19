import { useState } from "react";
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

export const PaymentModal = ({
  open,
  onClose,
  total,
  orderNumber,
  onComplete,
}: PaymentModalProps) => {
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "credit">("cash");
  const [amountPaid, setAmountPaid] = useState(total);

  const change = paymentMethod === "cash" ? Math.max(0, amountPaid - total) : 0;
  const remaining = paymentMethod === "credit" ? total : 0;

  const handleNumberClick = (num: string) => {
    if (num === "C") {
      setAmountPaid(0);
    } else {
      const newValue = amountPaid.toString() + num;
      setAmountPaid(Number(newValue));
    }
  };

  const handlePayment = () => {
    onComplete({
      customerName,
      paymentMethod,
      amountPaid,
    });
    setCustomerName("");
    setAmountPaid(total);
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
              placeholder="Masukkan nama customer..."
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="mt-1.5"
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
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    paymentMethod === "cash" ? "bg-primary" : "bg-secondary"
                  )}
                >
                  <Banknote
                    className={cn(
                      "w-5 h-5",
                      paymentMethod === "cash" ? "text-primary-foreground" : "text-foreground"
                    )}
                  />
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
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    paymentMethod === "credit" ? "bg-primary" : "bg-secondary"
                  )}
                >
                  <FileText
                    className={cn(
                      "w-5 h-5",
                      paymentMethod === "credit" ? "text-primary-foreground" : "text-foreground"
                    )}
                  />
                </div>
                <span className="font-medium">Bon/Piutang</span>
              </button>
            </div>
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
              <Input
                id="amount"
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
                className="mt-1.5 text-lg font-semibold"
                disabled={paymentMethod === "credit"}
              />
            </div>

            {paymentMethod === "cash" && (
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-muted-foreground">Kembalian</span>
                <span className="text-xl font-bold text-success">
                  Rp {change.toLocaleString("id-ID")}
                </span>
              </div>
            )}

            {paymentMethod === "credit" && (
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-muted-foreground">Sisa Tagihan</span>
                <span className="text-xl font-bold text-warning">
                  Rp {remaining.toLocaleString("id-ID")}
                </span>
              </div>
            )}
          </div>

          {paymentMethod === "cash" && (
            <div>
              <Label className="mb-3 block">Keypad Cepat</Label>
              <div className="grid grid-cols-3 gap-2">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "00", "C"].map((num) => (
                  <Button
                    key={num}
                    variant="outline"
                    size="lg"
                    onClick={() => handleNumberClick(num)}
                    className="h-14 text-lg font-semibold"
                  >
                    {num}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Button variant="cta" size="lg" className="w-full text-lg h-14" onClick={handlePayment}>
            BAYAR
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

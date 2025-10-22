import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bluetooth, AlertCircle } from "lucide-react";

interface BluetoothActivationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errorMessage?: string;
}

export const BluetoothActivationDialog = ({
  open,
  onOpenChange,
  errorMessage = "Bluetooth tidak tersedia atau belum diaktifkan",
}: BluetoothActivationDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Aktifkan Bluetooth
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Error Message */}
          <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
            <Bluetooth className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              {errorMessage}
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Langkah-langkah:</h4>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li>Buka <strong>Settings</strong> di Windows (Win + I)</li>
              <li>Pilih menu <strong>Bluetooth & devices</strong></li>
              <li>Aktifkan toggle <strong>Bluetooth</strong></li>
              <li>
                <strong className="text-amber-600">PENTING:</strong> Jika printer sudah paired di Windows (contoh: RPP02N),{" "}
                <strong>klik ⋮ → Remove device</strong> untuk unpair
              </li>
              <li>Reset printer ke mode pairing (lampu BERKEDIP cepat)</li>
              <li>Klik tombol <strong>Coba Lagi</strong> di bawah</li>
            </ol>
          </div>

          {/* Alternative Method */}
          <div className="p-3 bg-muted rounded-lg space-y-2">
            <p className="text-xs text-muted-foreground">
              <strong>Tips Cepat:</strong> Aktifkan Bluetooth dengan{" "}
              <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs">
                Win + A
              </kbd>{" "}
              → klik icon Bluetooth
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
              ⚠️ Web Bluetooth hanya bisa scan printer dalam mode PAIRING (lampu berkedip). 
              Printer yang sudah paired di Windows tidak akan terdeteksi!
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Tutup
          </Button>
          <Button
            variant="default"
            onClick={() => {
              onOpenChange(false);

              setTimeout(() => {
                window.location.reload(); // Refresh untuk retry
              }, 100);
            }}
            className="flex-1"
          >
            Coba Lagi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FolderOpen, Database, Download, CheckCircle, Rocket } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface FirstTimeSetupDialogProps {
  open: boolean;
  onComplete: (dbPath: string) => void;
}

export const FirstTimeSetupDialog = ({ open, onComplete }: FirstTimeSetupDialogProps) => {
  const [step, setStep] = useState<"welcome" | "location" | "ready">("welcome");
  const [dbPath, setDbPath] = useState("");
  const [isSelecting, setIsSelecting] = useState(false);

  const handleSelectFolder = async () => {
    setIsSelecting(true);
    try {
      // @ts-expect-error - electronAPI is injected by preload
      const result = await window.electronAPI.dialog.selectFolder();

      if (!result.canceled && result.folderPath) {
        setDbPath(result.folderPath);
      }
    } catch (error) {
      console.error("Failed to select folder:", error);
      toast.error("Gagal memilih folder");
    } finally {
      setIsSelecting(false);
    }
  };

  const handleNext = () => {
    if (step === "welcome") {
      setStep("location");
    } else if (step === "location" && dbPath) {
      setStep("ready");
    }
  };

  const handleComplete = () => {
    onComplete(dbPath);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-lg"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* STEP 1: Welcome */}
        {step === "welcome" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <Rocket className="w-6 h-6 text-primary" />
                Selamat Datang di POS System!
              </DialogTitle>
              <DialogDescription className="text-base pt-2">
                Terima kasih telah menginstall POS System. Mari kita setup aplikasi Anda dalam 2
                langkah mudah.
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 space-y-4">
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">Pilih Lokasi Database</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Tentukan folder tempat menyimpan data POS Anda (produk, transaksi, dll)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0 font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-green-900">Download Data</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Unduh data produk, kategori, dan transaksi dari server
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleNext} className="w-full" size="lg">
                Mulai Setup <Rocket className="ml-2 w-4 h-4" />
              </Button>
            </DialogFooter>
          </>
        )}

        {/* STEP 2: Choose Location */}
        {step === "location" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Di Mana Database Mau Disimpan?
              </DialogTitle>
              <DialogDescription>
                Pilih folder untuk menyimpan database POS Anda. Pastikan lokasi yang dipilih
                memiliki ruang yang cukup.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="dbLocation">Lokasi Folder Database:</Label>
                <div className="flex gap-2">
                  <Input
                    id="dbLocation"
                    value={dbPath}
                    onChange={(e) => setDbPath(e.target.value)}
                    placeholder="Contoh: D:\POS_Data atau C:\Data\Kasir"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSelectFolder}
                    disabled={isSelecting}
                    size="icon"
                  >
                    <FolderOpen className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  💡 Tip: Pilih folder yang mudah diakses untuk backup
                </p>
              </div>

              {dbPath && (
                <div className="p-3 bg-green-50 border border-green-200 rounded flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-700">
                    <p className="font-semibold">Lokasi dipilih:</p>
                    <p className="break-all font-mono text-xs mt-1">{dbPath}</p>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep("welcome")}>
                Kembali
              </Button>
              <Button onClick={handleNext} disabled={!dbPath}>
                Lanjutkan
              </Button>
            </DialogFooter>
          </>
        )}

        {/* STEP 3: Ready */}
        {step === "ready" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <CheckCircle className="w-6 h-6 text-green-500" />
                Setup Selesai! Siap Download Data
              </DialogTitle>
              <DialogDescription>
                Database akan disimpan di lokasi yang Anda pilih. Klik tombol di bawah untuk mulai
                download data dari server.
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 space-y-4">
              <div className="p-4 bg-secondary rounded-lg space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Lokasi Database:</span>
                  <Database className="w-4 h-4 text-primary" />
                </div>
                <p className="font-mono text-xs break-all">{dbPath}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Yang Akan Didownload:
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Semua Produk dari Server
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Kategori Produk
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    Riwayat Transaksi
                  </li>
                </ul>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                <p>
                  💡 <strong>Tips:</strong> Pastikan koneksi internet stabil untuk download data.
                  Proses ini mungkin memakan waktu beberapa menit.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep("location")}>
                Ubah Lokasi
              </Button>
              <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700">
                <Download className="mr-2 w-4 h-4" />
                Mulai Download Data
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

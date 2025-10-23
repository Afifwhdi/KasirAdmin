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
import { FolderOpen, Database, AlertCircle } from "lucide-react";
import { useState } from "react";
import { electronDB } from "@/services/electron-db";
import { toast } from "sonner";

interface DatabaseSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPath: string;
}

export const DatabaseSettingsDialog = ({
  open,
  onOpenChange,
  currentPath,
}: DatabaseSettingsDialogProps) => {
  const [newPath, setNewPath] = useState(currentPath);
  const [isSelecting, setIsSelecting] = useState(false);

  const handleSelectFolder = async () => {
    setIsSelecting(true);
    try {

      const result = await window.electronAPI.dialog.selectFolder();

      if (!result.canceled && result.folderPath) {
        setNewPath(result.folderPath);
      }
    } catch (error) {
      toast.error("Gagal memilih folder");
    } finally {
      setIsSelecting(false);
    }
  };

  const handleSave = async () => {
    if (!newPath || newPath === currentPath) {
      onOpenChange(false);
      return;
    }

    try {
      const result = await electronDB.setDbPath(newPath);

      toast.success(result.message, {
        icon: "✓",
        style: {
          background: "#10b981",
          color: "white",
        },
        duration: 5000,
      });


      setTimeout(() => {
        onOpenChange(false);


        if (
          confirm("Aplikasi perlu di-restart untuk menggunakan database baru. Restart sekarang?")
        ) {
          window.location.reload();
        }
      }, 1000);
    } catch (error) {
      toast.error("Gagal mengubah lokasi database: " + (error as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Pengaturan Database
          </DialogTitle>
          <DialogDescription>
            Pilih lokasi folder untuk menyimpan database POS. Database akan dibuat otomatis di
            folder yang dipilih.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Path */}
          <div className="space-y-2">
            <Label>Lokasi Database Saat Ini:</Label>
            <div className="p-3 bg-secondary rounded text-sm break-all">
              {currentPath || "Loading..."}
            </div>
          </div>

          {/* New Path */}
          <div className="space-y-2">
            <Label htmlFor="dbPath">Lokasi Database Baru:</Label>
            <div className="flex gap-2">
              <Input
                id="dbPath"
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
                placeholder="Pilih folder atau ketik path manual"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSelectFolder}
                disabled={isSelecting}
              >
                <FolderOpen className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Contoh: D:\POS_Data atau C:\Users\YourName\Documents\POS
            </p>
          </div>

          {/* Warning */}
          <div className="flex gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-600">
              <p className="font-semibold">Perhatian:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Aplikasi akan restart setelah mengubah lokasi</li>
                <li>Database lama tidak akan dipindahkan otomatis</li>
                <li>Anda perlu download data ulang atau copy database manual</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={!newPath || newPath === currentPath}>
            Simpan & Restart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

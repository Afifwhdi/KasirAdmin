import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, Upload } from "lucide-react";

interface ClosingTimeReminderProps {
  onSyncClick: () => void;
}

export const ClosingTimeReminder = ({ onSyncClick }: ClosingTimeReminderProps) => {
  const [showReminder, setShowReminder] = useState(false);
  const [reminderShownToday, setReminderShownToday] = useState(false);

  useEffect(() => {
    // Check every minute
    const checkTime = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const today = now.toDateString();

      // Cek apakah sudah reminder hari ini
      const lastReminderDate = localStorage.getItem("lastReminderDate");

      // Jam 20:15 dan belum reminder hari ini
      if (hour === 20 && minute === 15 && lastReminderDate !== today && !reminderShownToday) {
        setShowReminder(true);
        setReminderShownToday(true);
        localStorage.setItem("lastReminderDate", today);
      }

      // Reset flag di jam 00:00 (tengah malam)
      if (hour === 0 && minute === 0) {
        setReminderShownToday(false);
      }
    };

    // Check immediately
    checkTime();

    // Then check every minute
    const interval = setInterval(checkTime, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [reminderShownToday]);

  const handleSyncNow = () => {
    setShowReminder(false);
    onSyncClick();
  };

  const handleLater = () => {
    setShowReminder(false);
  };

  return (
    <Dialog open={showReminder} onOpenChange={setShowReminder}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Clock className="w-6 h-6 text-orange-500" />
            Waktu Tutup Toko
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            Toko akan tutup jam 20:30. Jangan lupa backup data transaksi hari ini!
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Upload className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-orange-900">Backup Data Sekarang?</p>
                <p className="text-sm text-orange-700 mt-1">
                  Sync sekarang untuk memastikan semua transaksi hari ini tersimpan aman di server.
                </p>
              </div>
            </div>

            <div className="pl-8 space-y-1 text-sm text-orange-600">
              <p>✓ Upload transaksi hari ini</p>
              <p>✓ Download update produk & kategori</p>
              <p>✓ Data aman sebelum tutup toko</p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleLater} className="flex-1">
            Nanti Saja
          </Button>
          <Button onClick={handleSyncNow} className="flex-1 bg-orange-600 hover:bg-orange-700">
            <Upload className="w-4 h-4 mr-2" />
            Sync Sekarang
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

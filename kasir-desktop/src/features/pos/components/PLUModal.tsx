import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Scale } from "lucide-react";

interface PLUModalProps {
  open: boolean;
  onClose: () => void;
  productName: string;
  basePrice: number;
  onSelect: (weight: number, price: number, locked: boolean) => void;
}

export const PLUModal = ({ open, onClose, productName, basePrice, onSelect }: PLUModalProps) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const pluOptions = [
    {
      weight: 1,
      label: "1 Kg",
      description: "Bisa tambah jumlah",
      price: basePrice,
      locked: false,
    },
    {
      weight: 0.25,
      label: "1/4 Kg (250g)",
      description: "Jumlah tetap",
      price: basePrice * 0.25,
      locked: true,
    },
  ];

  const handleSelect = (option: (typeof pluOptions)[0]) => {
    setSelected(option.weight);
    setTimeout(() => {
      onSelect(option.weight, option.price, option.locked);
      setSelected(null);
      setSelectedIndex(0);
      onClose();
    }, 100);
  };

  // --- Arrow key navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Arrow Up
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      }
      // Arrow Down
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(pluOptions.length - 1, prev + 1));
      }
      // Enter untuk select
      if (e.key === "Enter") {
        e.preventDefault();
        handleSelect(pluOptions[selectedIndex]);
      }
      // Escape untuk close
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, selectedIndex]);

  // Reset selected index saat modal dibuka
  useEffect(() => {
    if (open) {
      setSelectedIndex(0);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            Pilih Ukuran
          </DialogTitle>
          <DialogDescription>
            {productName}
            <span className="block text-xs text-muted-foreground mt-1">
              Gunakan ↑↓ untuk navigasi, Enter untuk pilih
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {pluOptions.map((option, index) => (
            <button
              key={option.weight}
              onClick={() => handleSelect(option)}
              className={`
                w-full p-4 rounded-lg border-2 transition-all text-left
                ${
                  selected === option.weight
                    ? "border-primary bg-primary/10 scale-95"
                    : selectedIndex === index
                      ? "border-primary/70 bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-accent"
                }
              `}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {selectedIndex === index && <span className="text-primary">▶</span>}
                  <span className="font-semibold text-lg">{option.label}</span>
                </div>
                <span className="text-primary font-bold">
                  Rp {Math.round(option.price).toLocaleString("id-ID")}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{option.description}</p>
              {option.locked && (
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-yellow-500/10 border border-yellow-500/20">
                  <span className="text-xs text-yellow-700 dark:text-yellow-500">
                    ⚠️ Tidak bisa tambah qty
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Batal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CartItemProps {
  name: string;
  price: number;
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}

export const CartItem = ({
  name,
  price,
  quantity,
  onIncrease,
  onDecrease,
  onRemove,
}: CartItemProps) => {
  const total = price * quantity;

  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0">
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">{name}</h4>
        <p className="text-xs text-muted-foreground">Rp {price.toLocaleString("id-ID")} / unit</p>
      </div>

      <div className="flex items-center gap-2">
        <Button size="icon" variant="outline" className="h-8 w-8" onClick={onDecrease}>
          <Minus className="w-3 h-3" />
        </Button>
        <span className="w-8 text-center font-semibold">{quantity}</span>
        <Button size="icon" variant="outline" className="h-8 w-8" onClick={onIncrease}>
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      <div className="w-24 text-right">
        <p className="font-semibold text-sm">Rp {total.toLocaleString("id-ID")}</p>
      </div>

      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 text-destructive hover:bg-destructive/10"
        onClick={onRemove}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
};

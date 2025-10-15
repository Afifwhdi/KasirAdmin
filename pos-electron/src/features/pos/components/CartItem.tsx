import { Minus, Plus, Trash2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { memo } from "react";

interface CartItemProps {
  name: string;
  price: number;
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
  locked?: boolean;
  pluWeight?: number;
}

export const CartItem = memo(({ 
  name, 
  price, 
  quantity, 
  onIncrease, 
  onDecrease, 
  onRemove,
  locked = false,
  pluWeight
}: CartItemProps) => {
  const total = price * quantity;
  
  return (
    <div className="py-3 border-b border-dashed border-border last:border-0">
      {/* Item Header: Name and Remove */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-medium text-sm">{name}</h4>
          {pluWeight && (
            <span className="text-xs text-muted-foreground">
              {pluWeight === 1 ? "1 Kg" : pluWeight === 0.25 ? "1/4 Kg" : `${pluWeight} Kg`}
            </span>
          )}
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-destructive hover:bg-destructive/10 -mt-1"
          onClick={onRemove}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
      
      {/* Item Details: Price x Qty = Total */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground">
            Rp {price.toLocaleString('id-ID')}
          </span>
          <span className="text-muted-foreground">x</span>
          
          {/* Quantity Controls */}
          <div className="flex items-center gap-1.5 bg-secondary/50 rounded-md px-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={onDecrease}
            >
              <Minus className="w-3 h-3" />
            </Button>
            <span className="w-6 text-center font-semibold text-sm">{quantity}</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={onIncrease}
              disabled={locked}
              title={locked ? "Qty tidak bisa ditambah untuk produk PLU 1/4 Kg" : ""}
            >
              {locked ? (
                <Lock className="w-3 h-3 text-muted-foreground" />
              ) : (
                <Plus className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Item Total */}
        <div className="font-semibold">
          Rp {total.toLocaleString('id-ID')}
        </div>
      </div>
    </div>
  );
});

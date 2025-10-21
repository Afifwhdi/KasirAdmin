import { Card } from "@/components/ui/card";
import { Plus, Scale } from "lucide-react";
import { memo } from "react";

interface ProductCardProps {
  name: string;
  price: number;
  image?: string;
  stock?: number;
  onAdd: () => void;
  isPluEnabled?: boolean;
}

export const ProductCard = memo(({ name, price, image, stock, onAdd, isPluEnabled }: ProductCardProps) => {
  const isOutOfStock = stock !== undefined && stock <= 0;
  
  return (
    <Card
      className={`p-4 transition-shadow duration-150 relative ${
        isOutOfStock 
          ? "opacity-50 cursor-not-allowed" 
          : "cursor-pointer hover:shadow-md active:scale-95"
      }`}
      onClick={isOutOfStock ? undefined : onAdd}
    >
      {isPluEnabled && (
        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1.5 shadow-md">
          <Scale className="w-3 h-3" />
        </div>
      )}
      <div className="aspect-square bg-secondary rounded-lg mb-3 flex items-center justify-center overflow-hidden">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl text-muted-foreground">📦</span>
        )}
      </div>
      <h3 className="font-medium text-sm mb-2 line-clamp-2">{name}</h3>
      <div className="flex items-center justify-between mb-2">
        <p className="text-primary font-semibold text-base">Rp {price.toLocaleString("id-ID")}</p>
        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
          isOutOfStock ? "bg-gray-400" : "bg-primary"
        }`}>
          <Plus className="w-4 h-4 text-primary-foreground" />
        </div>
      </div>
      {stock !== undefined && (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${
          isOutOfStock 
            ? "bg-red-100 text-red-700" 
            : stock <= 5 
            ? "bg-orange-100 text-orange-700"
            : "bg-green-100 text-green-700"
        }`}>
          <span className="text-xs font-semibold">
            📦 Stok: {stock}
          </span>
          {isOutOfStock && <span className="text-xs font-bold">- HABIS</span>}
          {!isOutOfStock && stock <= 5 && <span className="text-xs">- SEDIKIT</span>}
        </div>
      )}
    </Card>
  );
});

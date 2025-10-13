import { Card } from "@/components/ui/card";
import { Plus, Scale } from "lucide-react";

interface ProductCardProps {
  name: string;
  price: number;
  image?: string;
  onAdd: () => void;
  isPluEnabled?: boolean;
}

export const ProductCard = ({ name, price, image, onAdd, isPluEnabled }: ProductCardProps) => {
  return (
    <Card 
      className="p-4 cursor-pointer hover:shadow-md transition-all hover:scale-105 active:scale-95 relative"
      onClick={onAdd}
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
      <h3 className="font-medium text-sm mb-1 line-clamp-2">{name}</h3>
      <div className="flex items-center justify-between">
        <p className="text-primary font-semibold">
          Rp {price.toLocaleString('id-ID')}
        </p>
        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
          <Plus className="w-4 h-4 text-primary-foreground" />
        </div>
      </div>
    </Card>
  );
};

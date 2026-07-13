import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: { id: string | number; title: string; price: number; image?: string; description?: string };
  onRedeem?: (id: string | number) => void;
  disabled?: boolean;
}

export default function ProductCard({ product, onRedeem, disabled }: ProductCardProps) {
  return (
    <Card className="rounded-xl border overflow-hidden shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="h-40 bg-muted flex items-center justify-center overflow-hidden">
        {product.image ? (
          <img src={product.image} alt={product.title} className="h-full w-full object-cover" />
        ) : (
          <div className="text-muted-foreground">No image</div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{product.title}</h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
          </div>
          <div className="text-right">
            <div className="font-bold">{product.price.toLocaleString()} pts</div>
            <Badge className="mt-2">In stock</Badge>
          </div>
        </div>

        <div className="mt-4">
          <Button onClick={() => onRedeem?.(product.id)} className="w-full" disabled={disabled}>
            {disabled ? "Not enough points" : "Redeem"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

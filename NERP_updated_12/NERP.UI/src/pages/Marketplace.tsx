import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProductCard from "@/components/marketplace/ProductCard";
import { useProducts, useRedeemProduct } from "@/hooks/useApiData";
import { toast } from "sonner";

export default function Marketplace() {
  const { user } = useAuth();
  const { data: products = [], isLoading, isError } = useProducts();
  const redeem = useRedeemProduct();
  const availablePoints = user?.totalPoints ?? 0;

  const handleRedeem = async (id: string | number) => {
    try {
      await redeem.mutateAsync(Number(id));
      toast.success("Redeemed — your reward is being processed.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to redeem";
      toast.error(message);
    }
  };

  return (
    <div className="container-page space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Rewards Marketplace</h1>
          <p className="text-muted-foreground mt-1">Redeem your recognition points for exclusive rewards.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-2xl border border-input bg-background px-4 py-3">
          <span className="text-sm text-muted-foreground">Your balance</span>
          <Badge className="bg-primary text-primary-foreground">{availablePoints.toLocaleString()} pts</Badge>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center p-12 text-muted-foreground">Loading products...</div>
      ) : isError ? (
        <div className="text-center p-12 text-destructive">Unable to load products. Please try again later.</div>
      ) : products.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-muted p-12 text-center text-muted-foreground">
          No rewards are available right now. Check back later.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onRedeem={handleRedeem}
              disabled={product.price > availablePoints}
            />
          ))}
        </div>
      )}
    </div>
  );
}

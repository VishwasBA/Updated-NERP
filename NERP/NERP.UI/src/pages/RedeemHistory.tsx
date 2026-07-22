import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRedeemHistory } from "@/hooks/useApiData";
import { History } from "lucide-react";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  delivered: "default",
  processing: "secondary",
  pending: "secondary",
  rejected: "destructive",
};

export default function RedeemHistory() {
  const { data: history = [], isLoading } = useRedeemHistory();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <History className="w-6 h-6 text-primary" /> Redeem History
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Track your reward redemption history</p>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-3 px-4">Reward</th>
                <th className="py-3 px-4">Points</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">
                    Loading history...
                  </td>
                </tr>
              )}
              {!isLoading && history.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">
                    No redemptions yet.
                  </td>
                </tr>
              )}
              {history.map((h) => (
                <tr key={h.id}>
                  <td className="py-3 px-4 font-medium">{h.productTitle}</td>
                  <td className="py-3 px-4">{h.points.toLocaleString()} pts</td>
                  <td className="py-3 px-4">
                    <Badge variant={statusVariant[h.status] ?? "secondary"} className="capitalize">
                      {h.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {new Date(h.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

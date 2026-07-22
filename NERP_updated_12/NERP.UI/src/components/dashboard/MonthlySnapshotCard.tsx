import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Target } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MonthlySnapshotCard({
  trend,
  isLoading,
}: {
  trend: { label: string; value: number }[];
  isLoading?: boolean;
}) {
  const current = trend[trend.length - 1];
  const previous = trend[trend.length - 2];

  const currentValue = current?.value ?? 0;
  const previousValue = previous?.value ?? 0;
  const delta = previousValue === 0 ? (currentValue > 0 ? 100 : 0) : Math.round(((currentValue - previousValue) / previousValue) * 100);
  const maxValue = Math.max(1, ...trend.map((t) => t.value));

  const Trend = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const trendColor = delta > 0 ? "text-success bg-success/10" : delta < 0 ? "text-destructive bg-destructive/10" : "text-muted-foreground bg-muted";

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-[18px] w-[18px] text-primary" />
          Monthly Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="h-24 animate-pulse rounded-2xl bg-muted" />
        ) : (
          <>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-3xl font-bold leading-none text-foreground">{currentValue}</p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  recognitions {current?.label ? `in ${current.label}` : "this month"}
                </p>
              </div>
              <span className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", trendColor)}>
                <Trend className="h-3.5 w-3.5" />
                {delta > 0 ? "+" : ""}
                {delta}%
              </span>
            </div>

            {/* Small trend bars — last few months, current month highlighted */}
            <div className="mt-5 flex items-end gap-1.5">
              {trend.slice(-8).map((t, i, arr) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className={cn(
                      "w-full rounded-t-md transition-all",
                      i === arr.length - 1 ? "bg-primary" : "bg-muted"
                    )}
                    style={{ height: `${Math.max(6, (t.value / maxValue) * 56)}px` }}
                  />
                  <span className="text-[9px] text-muted-foreground">{t.label?.slice(0, 3)}</span>
                </div>
              ))}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">vs. previous month ({previousValue})</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

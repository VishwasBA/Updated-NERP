import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { ApiDepartmentEngagement } from "@/services/api";

export default function DepartmentOverviewCard({
  departments,
  isLoading,
}: {
  departments: ApiDepartmentEngagement[];
  isLoading?: boolean;
}) {
  const top = [...departments].sort((a, b) => b.recognitions - a.recognitions).slice(0, 6);
  const maxRecognitions = Math.max(1, ...top.map((d) => d.recognitions));

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-[18px] w-[18px] text-primary" />
          Department Engagement
        </CardTitle>
        <span className="text-xs font-medium text-muted-foreground">Last 6 months</span>
      </CardHeader>

      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : top.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-muted-foreground">
            <Building2 className="h-7 w-7 text-muted-foreground/40" />
            <p className="text-sm">No department activity yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {top.map((d) => (
              <div key={d.department}>
                <div className="mb-1.5 flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">{d.department}</p>
                  <p className="shrink-0 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{d.recognitions}</span> recognitions ·{" "}
                    {d.participationRate}% participation
                  </p>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                    style={{ width: `${Math.max(4, (d.recognitions / maxRecognitions) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

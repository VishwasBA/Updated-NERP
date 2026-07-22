import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flag, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { ApiMilestone } from "@/services/api";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function MilestonesPanel({
  milestones,
  isLoading,
  title = "Your Badges",
  showViewAll = true,
}: {
  milestones: ApiMilestone[];
  isLoading?: boolean;
  title?: string;
  showViewAll?: boolean;
}) {
  // Surface the most relevant handful: recently earned ones first, then
  // whichever unearned milestones the person is closest to completing —
  // that's more useful on a dashboard glance than a fixed, often-empty list.
  const earned = milestones.filter((m) => m.earned);
  const inProgress = milestones
    .filter((m) => !m.earned)
    .sort((a, b) => b.progressPercent - a.progressPercent);
  const highlighted = [...earned.slice(0, 2), ...inProgress.slice(0, 3)].slice(0, 4);

  return (
    <Card className="flex h-full min-h-0 flex-col">
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle>{title}</CardTitle>
        {showViewAll && (
          <Link
            to="/profile"
            state={{ tab: "milestones" }}
            className="text-sm font-semibold text-primary hover:text-primary/80"
          >
            View All
          </Link>
        )}
      </CardHeader>

      <CardContent className="flex-1 min-h-0 overflow-y-auto pt-0">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : highlighted.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
            <Flag className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm">No badges to show yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {highlighted.map((m) => (
              <div
                key={m.key}
                className="flex items-start gap-3 rounded-2xl border border-border/60 p-3 transition hover:border-primary/30 hover:bg-primary/5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-lg">
                  {m.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">{m.title}</p>
                    {m.earned ? (
                      <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-success">
                        <CheckCircle2 className="h-3 w-3" />
                        {m.earnedDate ? formatDate(m.earnedDate) : "Earned"}
                      </span>
                    ) : (
                      <span className="shrink-0 text-[11px] font-medium text-muted-foreground">{m.progressPercent}%</span>
                    )}
                  </div>
                  {m.earned ? (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{m.description}</p>
                  ) : (
                    <Progress value={m.progressPercent} className="mt-1.5 h-1.5" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

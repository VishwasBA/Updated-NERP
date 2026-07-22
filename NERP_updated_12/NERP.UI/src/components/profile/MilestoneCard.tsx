import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2 } from "lucide-react";
import { ApiMilestone } from "@/services/api";
import { cn } from "@/lib/utils";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function MilestoneCard({ milestone }: { milestone: ApiMilestone }) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-2xl border transition-transform hover:scale-[1.02]",
        milestone.earned
          ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white dark:border-emerald-900/50 dark:from-emerald-950/30 dark:to-slate-950"
          : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl dark:bg-slate-900">
            {milestone.icon}
          </div>
          {milestone.earned && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" /> Earned
            </span>
          )}
        </div>

        <h3 className="mt-3 text-base font-bold text-slate-950 dark:text-white">{milestone.title}</h3>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{milestone.description}</p>

        {milestone.earned ? (
          <p className="mt-3 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            {milestone.earnedDate ? `Earned ${formatDate(milestone.earnedDate)}` : "Earned"}
          </p>
        ) : (
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Progress</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{milestone.progressPercent}%</span>
            </div>
            <Progress value={milestone.progressPercent} className="h-2" />
            <p className="text-xs text-slate-400 dark:text-slate-500">{milestone.progressLabel}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

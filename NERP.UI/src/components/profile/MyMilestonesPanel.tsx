import { useMemo } from "react";
import { useMyMilestones } from "@/hooks/useApiData";
import MilestoneCard from "@/components/profile/MilestoneCard";
import { Flag } from "lucide-react";

export default function MyMilestonesPanel() {
  const { data: milestones = [], isLoading } = useMyMilestones();

  const earnedCount = useMemo(() => milestones.filter((m) => m.earned).length, [milestones]);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">Milestones</h2>
        <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
          <Flag className="h-3.5 w-3.5" />
          {earnedCount} of {milestones.length} earned
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {milestones.map((m) => (
          <MilestoneCard key={m.key} milestone={m} />
        ))}
      </div>
    </div>
  );
}

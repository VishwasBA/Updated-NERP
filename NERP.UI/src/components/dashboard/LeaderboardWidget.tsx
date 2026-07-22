import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/avatar";
import { ApiLeaderboardEntry } from "@/services/api";
import { Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  topPerformers: ApiLeaderboardEntry[];
  isLoading?: boolean;
}

const MEDAL_STYLE: Record<number, { bg: string; label: string }> = {
  0: { bg: "bg-amber-400", label: "🥇" },
  1: { bg: "bg-slate-400", label: "🥈" },
  2: { bg: "bg-orange-400", label: "🥉" },
};

export default function LeaderboardWidget({ topPerformers, isLoading }: Props) {
  const topItems = topPerformers.slice(0, 5);
  const navigate = useNavigate();

  return (
    <Card className="h-auto">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <CardTitle>Top Performers</CardTitle>
        </div>
        <button
          onClick={() => navigate("/leaderboard")}
          className="text-sm font-semibold text-primary transition hover:text-primary/80"
        >
          View all
        </button>
      </CardHeader>

      <CardContent className="flex flex-col gap-2 pt-0">
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Loading...</p>
        ) : topItems.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No top performers yet</p>
        ) : (
          topItems.map((emp, idx) => {
            const topPoints = topItems[0]?.points ?? 1;
            const percentage = topPoints > 0 ? (emp.points / topPoints) * 100 : 0;

            return (
              <div
                key={emp.id}
                className="flex items-center gap-3 rounded-2xl px-1 py-1.5"
              >
                <div className="relative shrink-0">
                  <UserAvatar name={emp.name} size="h-11 w-11" fallbackClassName="text-xs font-bold" />
                  {idx < 3 ? (
                    <span
                      className={`absolute -bottom-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] text-white shadow ${MEDAL_STYLE[idx].bg}`}
                    >
                      {idx + 1}
                    </span>
                  ) : (
                    <span className="absolute -bottom-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-300 text-[10px] font-semibold text-foreground shadow">
                      {idx + 1}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate text-foreground">{emp.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{emp.role || emp.department}</p>
                </div>

                <div className="hidden sm:block w-24 md:w-32 mx-4 shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-full bg-muted h-2 rounded-full overflow-hidden cursor-pointer">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <span>{Math.round(percentage)}%</span>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {idx < 3 ? (
                  <div className="text-right shrink-0">
                    <p className="text-base font-bold leading-tight text-foreground">
                      {emp.points.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Points</p>
                  </div>
                ) : (
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-muted-foreground">#{idx + 1}</p>
                    <p className="text-base font-bold leading-tight text-foreground">
                      {emp.points.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Points</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

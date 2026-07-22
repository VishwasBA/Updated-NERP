import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/avatar";
import { TrendingUp, TrendingDown } from "lucide-react";
import { ApiTeamMember } from "@/services/api";

interface Props {
  topPerformers: ApiTeamMember[];
  bottomPerformers: ApiTeamMember[];
  isLoading?: boolean;
}

function PerformerRow({ member, rank }: { member: ApiTeamMember; rank: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40">
      <span className="w-5 text-center text-xs font-bold text-slate-400">{rank}</span>
      <UserAvatar name={member.name} avatar={member.avatar} size="h-9 w-9" fallbackClassName="text-xs font-bold" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{member.name}</p>
        <p className="truncate text-xs text-muted-foreground">{member.department}</p>
      </div>
      <span className="text-sm font-bold text-slate-900 dark:text-white">{member.points}</span>
    </div>
  );
}

export default function TopBottomPerformers({ topPerformers, bottomPerformers, isLoading }: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          <CardTitle className="text-base font-semibold">Top Performers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {isLoading ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Loading...</p>
          ) : topPerformers.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No data yet.</p>
          ) : (
            topPerformers.map((m, i) => <PerformerRow key={m.id} member={m} rank={i + 1} />)
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <TrendingDown className="h-4 w-4 text-rose-500" />
          <CardTitle className="text-base font-semibold">Bottom Performers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {isLoading ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Loading...</p>
          ) : bottomPerformers.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No data yet.</p>
          ) : (
            bottomPerformers.map((m, i) => <PerformerRow key={m.id} member={m} rank={i + 1} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/avatar";
import { Trophy, Award, Star } from "lucide-react";
import { ApiTeamMember } from "@/services/api";

interface Props {
  members: ApiTeamMember[];
  isLoading?: boolean;
}

const getRankEmoji = (rank: number) => {
  switch (rank) {
    case 1:
      return "1️⃣";
    case 2:
      return "2️⃣";
    case 3:
      return "3️⃣";
    default:
      return `${rank}`;
  }
};

export default function TeamPerformanceRankings({ members, isLoading }: Props) {
  // Sort members by points descending
  const sortedMembers = [...members].sort((a, b) => b.points - a.points);

  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-950 dark:border-slate-800 shadow-sm">
      <CardHeader className="flex flex-row items-center gap-2 border-b border-slate-100 dark:border-slate-900 pb-4">
        <Trophy className="h-5 w-5 text-amber-500" />
        <CardTitle className="text-lg font-bold text-slate-950 dark:text-white">Team Performance Rankings</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading rankings...</p>
        ) : sortedMembers.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No team members ranked yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/20 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <th className="px-6 py-3.5 w-20 text-center">Rank</th>
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5 text-center">Points</th>
                  <th className="px-6 py-3.5 text-center">Recognitions</th>
                  <th className="px-6 py-3.5 text-center">Awards</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-sm">
                {sortedMembers.map((m, index) => {
                  const rank = index + 1;
                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-center font-bold text-base">
                        <span className="inline-flex items-center justify-center min-w-7">
                          {getRankEmoji(rank)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={m.name} avatar={m.avatar} size="h-9 w-9" fallbackClassName="text-xs font-bold" />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white leading-none">{m.name}</p>
                            <p className="text-xs text-slate-400 mt-1">{m.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{m.department}</td>
                      <td className="px-6 py-4 text-center font-bold text-slate-950 dark:text-white">
                        {m.points.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md text-xs font-semibold">
                          <Star className="h-3 w-3" />
                          {m.recognitionCount ?? m.appreciationsReceived}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-md text-xs font-semibold">
                          <Award className="h-3 w-3" />
                          {m.awardsCount ?? 0}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/avatar";
import { ArrowRight } from "lucide-react";
import { ApiRecognition } from "@/services/api";

interface Props {
  items: ApiRecognition[];
  isLoading?: boolean;
}

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function RecentTeamAppreciations({ items, isLoading }: Props) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Recent Team Appreciations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {isLoading ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Loading...</p>
        ) : items.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No recognitions for your team yet.</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40"
            >
              <UserAvatar name={item.fromEmployee.name} size="h-8 w-8" fallbackClassName="text-xs font-bold" />
              <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
              <UserAvatar name={item.toEmployee.name} size="h-8 w-8" fallbackClassName="text-xs font-bold" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  <span className="font-semibold text-slate-900 dark:text-white">{item.fromEmployee.name}</span>{" "}
                  <span className="text-muted-foreground">appreciated</span>{" "}
                  <span className="font-semibold text-slate-900 dark:text-white">{item.toEmployee.name}</span>
                </p>
                <p className="truncate text-xs text-muted-foreground">{item.message}</p>
              </div>
              <span className="flex-shrink-0 text-xs text-muted-foreground">{timeAgo(item.createdAt)}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

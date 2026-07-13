import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/avatar";
import { Cake, Sparkles, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { ApiNotification } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const typeMeta: Record<string, { label: string; badge: string; icon: typeof Cake }> = {
  birthday: {
    label: "Birthday Wishes",
    badge: "bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300",
    icon: Cake,
  },
  anniversary: {
    label: "Work Anniversary Wishes",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    icon: Sparkles,
  },
};

export default function MilestonesPanel({
  items,
  isLoading,
}: {
  items: ApiNotification[];
  isLoading?: boolean;
}) {
  const { user } = useAuth();

  return (
    <Card className="flex h-full min-h-0 flex-col rounded-3xl border border-slate-200/70 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-950">
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Your Milestones</CardTitle>
        <Link to="/notifications" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
          View All
        </Link>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 overflow-y-auto pt-0">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center text-slate-500 dark:text-slate-400">
            <Cake className="h-8 w-8 text-slate-300 dark:text-slate-700" />
            <p className="text-sm">No birthday or anniversary milestones for you yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((n) => {
              const meta = typeMeta[n.type] ?? { label: n.title, badge: "bg-slate-100 text-slate-600", icon: Sparkles };
              const Icon = meta.icon;
              return (
                <div
                  key={n.id}
                  className="flex items-start gap-3 rounded-2xl border border-slate-100 p-3 transition hover:border-blue-100 hover:bg-blue-50/40 dark:border-slate-800 dark:hover:bg-slate-900/60"
                >
                  <UserAvatar name={user?.name} size="h-10 w-10" fallbackClassName="text-xs font-bold" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.badge}`}>
                        <Icon className="h-3 w-3" /> {meta.label}
                      </span>
                      <span className="shrink-0 text-[11px] text-slate-400">{formatDate(n.createdAt)}</span>
                    </div>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-white">{user?.name}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{n.message}</p>
                  </div>
                  <Heart className="mt-1 h-4 w-4 shrink-0 text-slate-300 dark:text-slate-700" />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

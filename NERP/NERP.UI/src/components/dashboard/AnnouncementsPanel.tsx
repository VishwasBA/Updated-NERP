import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone } from "lucide-react";
import { Link } from "react-router-dom";
import { ApiNotification } from "@/services/api";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function AnnouncementsPanel({
  notifications,
  isLoading,
}: {
  notifications: ApiNotification[];
  isLoading?: boolean;
}) {
  const announcements = notifications.filter((n) => n.type === "announcement").slice(0, 4);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-[18px] w-[18px] text-primary" />
          Announcements
        </CardTitle>
        <Link to="/notifications" className="text-sm font-semibold text-primary hover:text-primary/80">
          View All
        </Link>
      </CardHeader>

      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-muted-foreground">
            <Megaphone className="h-7 w-7 text-muted-foreground/40" />
            <p className="text-sm">No announcements right now.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className="rounded-2xl border border-border/60 p-3.5 transition hover:border-primary/30 hover:bg-primary/5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{a.title}</p>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{formatDate(a.createdAt)}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.message}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

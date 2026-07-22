import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/avatar";
import { Heart, Gift } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { cn, getLocationFlag } from "@/lib/utils";
import { COMPANY_NAME } from "@/lib/constants";
import { ApiMilestoneFeedItem } from "@/services/api";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function MilestoneRow({ item }: { item: ApiMilestoneFeedItem }) {
  const [celebrated, setCelebrated] = useState(false);
  const isBirthday = item.type === "birthday";
  const flag = getLocationFlag(item.location);

  const handleCelebrate = () => {
    setCelebrated((c) => !c);
    if (!celebrated) {
      toast.success(`🎉 Sent your wishes to ${item.employeeName.split(" ")[0]}!`);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl px-1 py-2.5 transition hover:bg-muted/60">
      <UserAvatar name={item.employeeName} size="h-11 w-11 shrink-0" fallbackClassName="text-sm font-bold" />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-xs font-semibold",
              isBirthday
                ? "bg-success/10 text-success"
                : "bg-warning/10 text-warning"
            )}
          >
            {item.title}
          </span>
          <span className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</span>
        </div>
        <p className="mt-1 truncate text-sm font-bold text-foreground">{item.employeeName}</p>
        <p className="truncate text-xs text-muted-foreground">
          {COMPANY_NAME}
          {item.role ? ` · ${item.role}` : ""}
          {item.location ? ` · ${flag} ${item.location}` : ""}
        </p>
      </div>

      <button
        onClick={handleCelebrate}
        aria-label={celebrated ? "Wishes sent" : "Send wishes"}
        className="shrink-0 rounded-full p-1.5 text-muted-foreground/50 transition hover:bg-destructive/10 hover:text-destructive"
      >
        <Heart className={cn("h-4 w-4", celebrated && "fill-destructive text-destructive")} />
      </button>
    </div>
  );
}

export default function LatestMilestonesPanel({
  items,
  isLoading,
}: {
  items: ApiMilestoneFeedItem[];
  isLoading?: boolean;
}) {
  const recent = items.slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle>Birthdays &amp; Anniversaries</CardTitle>
        <Link
          to="/my-recognitions"
          state={{ tab: "milestones" }}
          className="text-sm font-semibold text-primary hover:text-primary/80"
        >
          View All
        </Link>
      </CardHeader>

      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
            <Gift className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm">No birthdays or work anniversaries today.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {recent.map((item) => (
              <MilestoneRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/avatar";
import { Heart, Trophy, Zap, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
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
  const [filter, setFilter] = useState<"all" | "appreciation" | "awards" | "approvals">("all");
  const [expanded, setExpanded] = useState(false);

  const handleFilterChange = (newFilter: typeof filter) => {
    setFilter(newFilter);
    setExpanded(false);
  };

  const getRecognitionDetails = (item: ApiRecognition) => {
    if (item.type === "appreciation") {
      return {
        label: "Appreciation",
        icon: Heart,
        color: "text-rose-500 bg-rose-50 dark:bg-rose-950/30",
        badge: "bg-rose-100/70 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
        text: "sent appreciation to",
      };
    }

    const awardType = item.category?.awardType || "spot";
    if (awardType === "performance") {
      return {
        label: "Performance Award",
        icon: Trophy,
        color: "text-amber-500 bg-amber-50 dark:bg-amber-950/30",
        badge: "bg-amber-100/70 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
        text: "nominated for",
      };
    }

    return {
      label: "Spot Award",
      icon: Zap,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30",
      badge: "bg-emerald-100/70 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
      text: "nominated for",
    };
  };

  const filteredItems = items.filter((item) => {
    if (filter === "all") return true;
    if (filter === "appreciation") return item.type === "appreciation";
    if (filter === "awards") {
      return item.type === "nomination" && (item.status === "Approved" || item.status === "Approved Winner" || item.status === "approved" || item.status === "Winner");
    }
    if (filter === "approvals") {
      return item.type === "nomination";
    }
    return true;
  });

  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-950 dark:border-slate-800 shadow-sm">
      <CardHeader className="flex flex-col gap-4 border-b border-slate-100 dark:border-slate-900 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-bold text-slate-950 dark:text-white">Recent Team Activity</CardTitle>
        </div>
        <div className="flex flex-wrap gap-1">
          {(["all", "appreciation", "awards", "approvals"] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleFilterChange(t)}
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${
                filter === t
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-black"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              {t === "all" ? "All Activity" : t === "appreciation" ? "Appreciations" : t === "awards" ? "Awards" : "Approvals"}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading activity...</p>
        ) : filteredItems.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No recent activity found matching selection.</p>
        ) : (
          <>
            <div className="space-y-4">
              {(expanded ? filteredItems : filteredItems.slice(0, 5)).map((item) => {
                const details = getRecognitionDetails(item);
                const Icon = details.icon;
                const awardName = item.category?.name ?? item.customCategory ?? "Recognition";
                const isApproved = item.status === "Approved" || item.status === "Approved Winner" || item.status === "approved";

                return (
                  <div
                    key={item.id}
                    className="relative flex items-start gap-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 p-4 transition-all hover:shadow-sm dark:bg-slate-900/10"
                  >
                    {/* Activity Icon Column */}
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${details.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Activity Body */}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${details.badge}`}>
                          {details.label}
                        </span>
                        {item.awardCycle && (
                          <span className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded text-[10px] font-medium">
                            Cycle: {item.awardCycle}
                          </span>
                        )}
                        <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isApproved 
                            ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400" 
                            : item.status.includes("Reject") 
                              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                        }`}>
                          {item.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2 text-sm text-slate-600 dark:text-slate-300">
                        <span className="font-semibold text-slate-900 dark:text-white">{item.fromEmployee.name}</span>
                        <span className="text-slate-400 dark:text-slate-500">{details.text}</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {item.type === "appreciation" ? item.toEmployee.name : `${item.toEmployee.name} (${awardName})`}
                        </span>
                      </div>

                      {item.message && (
                        <p className="border-l-2 border-slate-200 pl-3 text-xs italic text-slate-500 dark:border-slate-800 dark:text-slate-400 line-clamp-2">
                          "{item.message}"
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                        <span>+{item.points} points awarded</span>
                        <span>{timeAgo(item.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {filteredItems.length > 5 && (
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition dark:text-sky-400 dark:hover:text-sky-300"
                >
                  {expanded ? (
                    <>
                      Show Less <ChevronUp className="h-3.5 w-3.5" />
                    </>
                  ) : (
                    <>
                      View All Activities <ChevronDown className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

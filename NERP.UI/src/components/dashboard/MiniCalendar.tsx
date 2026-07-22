import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
import { ApiMilestoneFeedItem } from "@/services/api";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function MiniCalendar({ milestones }: { milestones: ApiMilestoneFeedItem[] }) {
  const today = useMemo(() => new Date(), []);

  const { cells, monthLabel, markedDays } = useMemo(() => {
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Mark days this month that have a real birthday/anniversary entry.
    const marked = new Set<number>();
    milestones.forEach((m) => {
      const d = new Date(m.createdAt);
      if (d.getFullYear() === year && d.getMonth() === month) {
        marked.add(d.getDate());
      }
    });

    const grid: (number | null)[] = Array(firstDay).fill(null);
    for (let day = 1; day <= daysInMonth; day++) grid.push(day);

    return {
      cells: grid,
      monthLabel: today.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
      markedDays: marked,
    };
  }, [today, milestones]);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-[18px] w-[18px] text-primary" />
          {monthLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((d, i) => (
            <span key={i} className="py-1 text-[11px] font-semibold text-muted-foreground">
              {d}
            </span>
          ))}
          {cells.map((day, i) => {
            const isToday = day === today.getDate();
            const hasEvent = day !== null && markedDays.has(day);
            return (
              <div
                key={i}
                className={cn(
                  "relative flex h-8 items-center justify-center rounded-full text-xs font-medium",
                  day === null && "invisible",
                  isToday
                    ? "bg-primary text-primary-foreground font-bold shadow-glow-primary"
                    : "text-foreground hover:bg-muted"
                )}
              >
                {day}
                {hasEvent && !isToday && (
                  <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-accent" />
                )}
              </div>
            );
          })}
        </div>
        {markedDays.size > 0 && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {markedDays.size} birthday{markedDays.size !== 1 ? "s" : ""}/anniversar
            {markedDays.size !== 1 ? "ies" : "y"} this month
          </p>
        )}
      </CardContent>
    </Card>
  );
}

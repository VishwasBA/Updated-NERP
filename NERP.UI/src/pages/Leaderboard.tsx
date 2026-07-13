import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useEmployees, useWallOfFameAwards } from "@/hooks/useApiData";
import { Trophy, Search, SlidersHorizontal, Download, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo, useState } from "react";
import { getLocationFlag } from "@/lib/utils";
import { COMPANY_NAME } from "@/lib/constants";

type TimePeriod = "all" | "week" | "month" | "year";

const TIME_PERIOD_LABEL: Record<TimePeriod, string> = {
  all: "All",
  week: "This Week",
  month: "This Month",
  year: "This Year",
};

function isWithinPeriod(dateStr: string, period: TimePeriod): boolean {
  if (period === "all") return true;
  const date = new Date(dateStr);
  const now = new Date();
  if (period === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    return date >= weekAgo;
  }
  if (period === "month") {
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }
  // year
  return date.getFullYear() === now.getFullYear();
}

export default function Leaderboard() {
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  // Approved nominations are the "Awards" this board ranks by — reusing the
  // same feed the Wall of Fame renders so the two stay consistent.
  const { data: awards = [], isLoading: awardsLoading } = useWallOfFameAwards();
  const { user } = useAuth();

  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const isLoading = employeesLoading || awardsLoading;

  const departments = useMemo(
    () => Array.from(new Set(employees.map((e) => e.department).filter(Boolean))) as string[],
    [employees]
  );

  // Award count per employee, scoped to the selected time period. Recomputed
  // only when the underlying data or the period actually changes — not on
  // every keystroke in the search box.
  const ranked = useMemo(() => {
    const countByEmployee = new Map<number, number>();
    for (const award of awards) {
      if (!isWithinPeriod(award.createdAt, timePeriod)) continue;
      const id = award.toEmployeeId;
      countByEmployee.set(id, (countByEmployee.get(id) ?? 0) + 1);
    }

    return employees
      .map((emp) => ({ ...emp, awardsCount: countByEmployee.get(emp.id) ?? 0 }))
      .sort((a, b) => b.awardsCount - a.awardsCount);
  }, [employees, awards, timePeriod]);

  const filtered = useMemo(() => {
    return ranked.filter((emp) => {
      const matchesSearch = emp.name?.toLowerCase().includes(search.toLowerCase());
      const matchesDept = deptFilter === "all" || emp.department === deptFilter;
      return matchesSearch && matchesDept;
    });
  }, [ranked, search, deptFilter]);

  const displayed = useMemo(() => (showAll ? filtered : filtered.slice(0, 8)), [showAll, filtered]);

  const maxAwards = filtered[0]?.awardsCount || 1;

  const activeFilterCount = (deptFilter !== "all" ? 1 : 0) + (timePeriod !== "all" ? 1 : 0) + (search ? 1 : 0);

  const handleClearAll = () => {
    setSearch("");
    setDeptFilter("all");
    setTimePeriod("all");
  };

  const handleExport = () => {
    const rows = [["Rank", "Employee", "Department", "Awards"]].concat(
      filtered.map((emp, i) => [String(i + 1), emp.name ?? "", emp.department ?? "", String(emp.awardsCount)])
    );
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "leaderboard.csv";
    link.click();
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-12 text-muted-foreground">Loading leaderboard...</div>;
  }

  return (
    <div className="container-page space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-500" /> Leaderboard
        </h1>

        <div className="flex flex-wrap items-center gap-3">
          {timePeriod !== "all" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-slate-900">
              Time Period: {TIME_PERIOD_LABEL[timePeriod]}
              <button onClick={() => setTimePeriod("all")} aria-label="Clear time period filter">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          )}

          {activeFilterCount > 0 && (
            <button
              onClick={handleClearAll}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-sky-400"
            >
              Clear All
            </button>
          )}

          <button
            onClick={handleExport}
            aria-label="Export CSV"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <Download className="h-4 w-4" />
          </button>

          <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
            <PopoverTrigger asChild>
              <button
                aria-label="Filters"
                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-950"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 space-y-3 rounded-2xl p-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Time Period</label>
                <select
                  value={timePeriod}
                  onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  {(Object.keys(TIME_PERIOD_LABEL) as TimePeriod[]).map((p) => (
                    <option key={p} value={p}>
                      {TIME_PERIOD_LABEL[p]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Department</label>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="all">All Departments</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Search</label>
                <div className="relative mt-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search employee..."
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Ranked list */}
      <div className="space-y-3">
        {displayed.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No employees found for these filters.
            </CardContent>
          </Card>
        ) : (
          displayed.map((emp, i) => {
            const rank = i + 1;
            const percentage = maxAwards > 0 ? Math.max((emp.awardsCount / maxAwards) * 100, 4) : 0;
            const flag = getLocationFlag(emp.location);
            const isMe = emp.id === user?.id;

            return (
              <Card
                key={emp.id}
                className={`rounded-2xl transition ${
                  isMe ? "border-primary/40 bg-primary/5" : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <CardContent className="flex items-center gap-4 p-4 sm:gap-6">
                  <span className="w-8 shrink-0 text-lg font-bold text-blue-700 dark:text-sky-400">
                    {String(rank).padStart(2, "0")}
                  </span>

                  <UserAvatar name={emp.name} size="h-11 w-11" fallbackClassName="text-sm font-bold" />

                  <div className="w-48 shrink-0 sm:w-56">
                    <p className="truncate text-sm font-bold text-blue-900 dark:text-sky-300">
                      {emp.name}
                      {isMe && <span className="ml-1.5 text-xs font-semibold text-primary">(You)</span>}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{COMPANY_NAME}</p>
                    {emp.location && (
                      <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                        {flag} {emp.location}
                      </p>
                    )}
                  </div>

                  <div className="hidden flex-1 sm:block">
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-slate-900 to-slate-400 transition-all duration-500 ease-out dark:from-slate-100 dark:to-slate-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="ml-auto flex shrink-0 flex-col items-end gap-1">
                    <span className="text-xl font-bold text-blue-900 dark:text-sky-300">{emp.awardsCount}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      Awards
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {filtered.length > 8 && (
        <div className="pt-1 text-center">
          <button
            onClick={() => setShowAll((v) => !v)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-sky-400"
          >
            {showAll ? "Show Less" : `View Full Leaderboard (${filtered.length})`}
          </button>
        </div>
      )}
    </div>
  );
}

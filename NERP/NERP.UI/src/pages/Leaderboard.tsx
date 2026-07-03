import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useEmployees } from "@/hooks/useApiData";
import {
  Trophy,
  Award as AwardIcon,
  Star as StarIcon,
  ArrowRight,
  Search,
  Download,
  Calendar,
  Users,
  Lightbulb,
} from "lucide-react";
import { useRecognitions } from "@/hooks/useApiData";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo, useState } from "react";

const medals = ["🥇", "🥈", "🥉"];

const podiumCardBg = [
  "bg-gradient-to-b from-amber-50 to-yellow-50 border-amber-200", // 1st
  "bg-slate-50 border-slate-200", // 2nd
  "bg-gradient-to-b from-orange-50 to-amber-50 border-orange-200", // 3rd
];

const podiumBadgeBg = ["bg-amber-400", "bg-slate-300", "bg-orange-300"];
const podiumPointsPill = [
  "bg-amber-200 text-amber-900",
  "bg-indigo-100 text-indigo-700",
  "bg-orange-200 text-orange-900",
];

export default function Leaderboard() {
  const { data: employees = [], isLoading } = useEmployees();
  const { data: recognitions = [] } = useRecognitions();

  const leaderboard = employees.map((emp) => {
    const points = recognitions
      .filter((r) => r.toEmployee?.id === emp.id && r.type === "nomination")
      .reduce((sum, r) => sum + r.points, 0);

    return { ...emp, points };
  });

  const sorted = leaderboard.sort((a, b) => b.points - a.points);
  const { user } = useAuth();
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");

  const departments = useMemo(
    () => Array.from(new Set(employees.map((e) => e.department).filter(Boolean))) as string[],
    [employees]
  );

  const rest = sorted.slice(3);

  const filteredRest = rest.filter((emp) => {
    const matchesSearch = emp.name?.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === "all" || emp.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const displayedEmployees = showAll ? filteredRest : filteredRest.slice(0, 5);

  const employeesRecognized = new Set(
    recognitions.map((r) => r.toEmployee?.id).filter((id) => id != null)
  ).size;

  const recognitionsThisMonth = recognitions.filter((r) => {
    const d = (r as any).createdAt ? new Date((r as any).createdAt) : null;
    if (!d) return false;
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const totalPointsAwarded = recognitions
    .filter((r) => r.type === "nomination")
    .reduce((sum, r) => sum + (r.points || 0), 0);

  const handleExport = () => {
    const rows = [["Rank", "Employee", "Department", "Points"]].concat(
      sorted.map((emp, i) => [String(i + 1), emp.name ?? "", emp.department ?? "", String(emp.points)])
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
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-gold" /> Leaderboard
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Top performing employees by recognition points</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <Calendar className="h-4 w-4" />
            This Month
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-600 shadow-sm hover:bg-blue-50 dark:border-blue-900 dark:bg-slate-900"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        {[1, 0, 2].map((idx) => {
          const emp = sorted[idx];
          if (!emp) return null;
          const raised = idx === 0;

          return (
            <Card
              key={emp.id}
              className={`relative text-center rounded-2xl border ${podiumCardBg[idx]} ${raised ? "sm:-translate-y-3" : ""}`}
            >
              <CardContent className="p-5 relative">
                <div
                  className={`absolute -top-4 left-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full text-white text-sm font-bold shadow ${podiumBadgeBg[idx]}`}
                >
                  {idx + 1}
                </div>

                <Avatar className="h-16 w-16 mx-auto mb-3 mt-3">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                    {emp.avatar}
                  </AvatarFallback>
                </Avatar>

                <h3 className="font-bold">{emp.name}</h3>
                <p className="text-sm text-muted-foreground">{emp.department}</p>

                <div className={`mt-3 inline-block rounded-full px-4 py-1 text-sm font-semibold ${podiumPointsPill[idx]}`}>
                  {emp.points.toLocaleString()} pts
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employee..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <option>All Teams</option>
            </select>
          </div>

          <Card className="overflow-hidden border bg-card rounded-2xl">
            <CardContent className="p-0">
              <div className="grid grid-cols-5 px-6 py-3 text-xs font-semibold border-b bg-muted/30">
                <div>Rank</div>
                <div>Employee</div>
                <div>Department</div>
                <div>Recognitions</div>
                <div>Points</div>
              </div>
              {displayedEmployees.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No employees found</p>
              ) : (
                displayedEmployees.map((emp, i) => {
                  const percentage = sorted[0]?.points > 0 ? (emp.points / sorted[0].points) * 100 : 0;
                  const recCount = recognitions.filter(
                    (r) => r.toEmployee?.id === emp.id && r.type === "nomination"
                  ).length;

                  return (
                    <div
                      key={emp.id}
                      className={`grid grid-cols-5 items-center px-6 py-4 border-b last:border-b-0 transition-all duration-300 ${
                        emp.id === user?.id
                          ? "bg-gradient-to-r from-primary/15 via-primary/5 to-transparent border-l-4 border-l-primary"
                          : "hover:bg-muted/20"
                      }`}
                    >
                      <div className="font-semibold text-muted-foreground">{i + 4}</div>

                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{emp.avatar}</AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{emp.name}</span>
                          {emp.id === user?.id && (
                            <Badge className="bg-primary text-primary-foreground">You</Badge>
                          )}
                        </div>
                      </div>

                      <div>
                        <Badge variant="secondary" className="text-xs">
                          {emp.department}
                        </Badge>
                      </div>

                      <div className="text-muted-foreground">{recCount}</div>

                      <div className="font-semibold text-blue-600">{emp.points.toLocaleString()} pts</div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {filteredRest.length > 5 && (
            <div className="pt-2">
              <button
                onClick={() => setShowAll(!showAll)}
                className="dashboard-viewall inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                {showAll ? "Show Less" : "View Full Leaderboard"}
                <ArrowRight className={`h-4 w-4 transition-transform ${showAll ? "rotate-90" : ""}`} />
              </button>
            </div>
          )}
        </div>

        <div className="xl:col-span-1 space-y-4">
          <Card className="rounded-2xl">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 font-semibold">
                <Trophy className="h-4 w-4 text-blue-500" />
                Leaderboard Insights
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/90 text-white">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold leading-tight">{employeesRecognized}</p>
                  <p className="text-xs text-muted-foreground">Employees Recognized</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/90 text-white">
                  <StarIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold leading-tight">{recognitionsThisMonth}</p>
                  <p className="text-xs text-muted-foreground">Recognitions this month</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/90 text-white">
                  <Trophy className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold leading-tight">{totalPointsAwarded.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Points Awarded</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                About Leaderboard
              </div>
              <p className="text-sm text-muted-foreground">
                Points are awarded when your colleagues appreciate your work. Keep going and stay on top! 🚀
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, LayoutGrid, List, Users2, Award, Coins, Heart, MapPin } from "lucide-react";
import { useEmployees } from "@/hooks/useApiData";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, getLocationFlag } from "@/lib/utils";

type ViewMode = "grid" | "list";

export default function Directory() {
  const { user } = useAuth();
  const { data: employees = [], isLoading } = useEmployees();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [view, setView] = useState<ViewMode>("grid");

  const departments = useMemo(
    () => Array.from(new Set(employees.map((e) => e.department).filter(Boolean))).sort(),
    [employees]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => {
      const matchesDept = department === "all" || e.department === department;
      const matchesSearch =
        !q ||
        e.name?.toLowerCase().includes(q) ||
        e.role?.toLowerCase().includes(q) ||
        e.department?.toLowerCase().includes(q);
      return matchesDept && matchesSearch;
    });
  }, [employees, search, department]);

  return (
    <div className="container-page flex flex-col gap-6 pb-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-[28px] font-bold tracking-tight text-foreground">Employee Directory</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isLoading
            ? "Loading your organization…"
            : `${employees.length} people across ${departments.length} department${departments.length !== 1 ? "s" : ""}`}
        </p>
      </motion.div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, role, or department…"
            className="h-12 w-full rounded-full border border-border bg-card pl-11 pr-4 text-sm shadow-card transition placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger className="h-12 w-full rounded-full border-border bg-card shadow-card sm:w-56">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl">
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex h-12 shrink-0 items-center gap-1 rounded-full border border-border bg-card p-1 shadow-card">
          <button
            onClick={() => setView("grid")}
            aria-label="Grid view"
            className={cn(
              "flex h-full items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition",
              view === "grid" ? "bg-primary text-primary-foreground shadow-glow-primary" : "text-muted-foreground hover:bg-muted"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("list")}
            aria-label="List view"
            className={cn(
              "flex h-full items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition",
              view === "list" ? "bg-primary text-primary-foreground shadow-glow-primary" : "text-muted-foreground hover:bg-muted"
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className={cn("grid gap-4", view === "grid" ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1")}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-[24px] border border-border bg-card" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Users2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">No employees found</p>
              <p className="mt-1 text-sm text-muted-foreground">Try a different search term or department.</p>
            </div>
          </CardContent>
        </Card>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((emp, i) => {
            const isMe = emp.id === user?.id;
            const flag = getLocationFlag(emp.location);
            return (
              <motion.div
                key={emp.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i, 8) * 0.03 }}
              >
                <Card className="group h-full transition hover:-translate-y-1">
                  <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                    <Link
                      to={isMe ? "/profile" : `/employees/${emp.id}`}
                      className="flex flex-col items-center gap-3"
                    >
                      <UserAvatar name={emp.name} size="h-16 w-16" fallbackClassName="text-lg font-bold" />
                      <div className="min-w-0">
                        <p className="truncate text-base font-bold text-foreground">{emp.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{emp.role}</p>
                      </div>

                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {emp.department}
                      </span>

                      {emp.location && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {flag} {emp.location}
                        </p>
                      )}

                      <div className="grid w-full grid-cols-2 gap-2 border-t border-border pt-3">
                        <div>
                          <p className="flex items-center justify-center gap-1 text-sm font-bold text-foreground">
                            <Coins className="h-3.5 w-3.5 text-warning" />
                            {emp.totalPoints}
                          </p>
                          <p className="text-[11px] text-muted-foreground">Points</p>
                        </div>
                        <div>
                          <p className="flex items-center justify-center gap-1 text-sm font-bold text-foreground">
                            <Award className="h-3.5 w-3.5 text-accent" />
                            {emp.nominationCount ?? 0}
                          </p>
                          <p className="text-[11px] text-muted-foreground">Awards</p>
                        </div>
                      </div>
                    </Link>

                    {!isMe && (
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="mt-1 w-full gap-1.5 rounded-full border-border opacity-0 transition group-hover:opacity-100 group-hover:border-primary/40 group-hover:bg-primary/5 group-hover:text-primary"
                      >
                        <Link to="/appreciate" state={{ employeeId: emp.id }}>
                          <Heart className="h-3.5 w-3.5" />
                          Appreciate
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((emp, i) => {
            const isMe = emp.id === user?.id;
            const flag = getLocationFlag(emp.location);
            return (
              <motion.div
                key={emp.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i, 10) * 0.02 }}
              >
                <Card className="transition hover:-translate-y-0.5">
                  <CardContent className="flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap">
                    <Link
                      to={isMe ? "/profile" : `/employees/${emp.id}`}
                      className="flex min-w-0 flex-1 items-center gap-4"
                    >
                      <UserAvatar name={emp.name} size="h-12 w-12 shrink-0" fallbackClassName="text-sm font-bold" />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-foreground">{emp.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {emp.role} · {emp.department}
                          {emp.location ? ` · ${flag} ${emp.location}` : ""}
                        </p>
                      </div>
                    </Link>

                    <div className="flex shrink-0 items-center gap-4">
                      <div className="text-center">
                        <p className="flex items-center gap-1 text-sm font-bold text-foreground">
                          <Coins className="h-3.5 w-3.5 text-warning" />
                          {emp.totalPoints}
                        </p>
                        <p className="text-[11px] text-muted-foreground">Points</p>
                      </div>
                      <div className="text-center">
                        <p className="flex items-center gap-1 text-sm font-bold text-foreground">
                          <Award className="h-3.5 w-3.5 text-accent" />
                          {emp.nominationCount ?? 0}
                        </p>
                        <p className="text-[11px] text-muted-foreground">Awards</p>
                      </div>
                    </div>

                    {!isMe && (
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="shrink-0 gap-1.5 rounded-full border-border hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                      >
                        <Link to="/appreciate" state={{ employeeId: emp.id }}>
                          <Heart className="h-3.5 w-3.5" />
                          Appreciate
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

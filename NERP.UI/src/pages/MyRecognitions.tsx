import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, Trophy, Flag } from "lucide-react";
import { useWallOfFameAwards, useWallOfFameMilestones } from "@/hooks/useApiData";
import { useAuth } from "@/contexts/AuthContext";
import WallOfFameCard, { WallOfFameCardData } from "@/components/wall-of-fame/WallOfFameCard";
import { cn } from "@/lib/utils";
import { COMPANY_NAME } from "@/lib/constants";

const PAGE_SIZE = 8;

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type Card = WallOfFameCardData & { _department?: string };

export default function MyRecognitions() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"awards" | "milestones">("awards");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [department, setDepartment] = useState("all");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const { data: awards = [], isLoading: awardsLoading } = useWallOfFameAwards();
  const { data: milestones = [], isLoading: milestonesLoading } = useWallOfFameMilestones();

  const departments = useMemo(() => {
    const set = new Set<string>();
    awards.forEach((r) => r.toEmployee?.department && set.add(r.toEmployee.department));
    milestones.forEach((m) => m.department && set.add(m.department));
    return Array.from(set).sort();
  }, [awards, milestones]);

  const awardCards: Card[] = useMemo(
    () =>
      awards.map((r) => ({
        id: `award-${r.id}`,
        date: formatDate(r.createdAt),
        name: r.toEmployee?.name ?? "Unknown",
        avatar: r.toEmployee?.avatar,
        location: r.toEmployee?.location,
        company: COMPANY_NAME,
        title: r.category?.name ?? r.customCategory ?? "Recognition Award",
        fromLabel: r.fromEmployee?.name ?? "NERP Team",
        message: r.message,
        kind: "award" as const,
        profileHref: r.toEmployee?.id === user?.id ? "/profile" : undefined,
        _department: r.toEmployee?.department,
        recognitionId: r.id,
        likeCount: r.likeCount ?? 0,
        commentCount: r.commentCount ?? 0,
        likedByMe: r.likedByMe ?? false,
      })),
    [awards, user?.id]
  );


  const milestoneCards: Card[] = useMemo(
    () =>
      milestones.map((m) => ({
        id: `milestone-${m.id}`,
        date: formatDate(m.createdAt),
        name: m.employeeName,
        avatar: m.avatar,
        location: m.location,
        company: COMPANY_NAME,
        title: m.type === "birthday" ? "Birthday Wishes" : "Work Anniversary Wishes",
        fromLabel: "NERP Team",
        message: m.message,
        kind: m.type,
        profileHref: m.employeeId === user?.id ? "/profile" : undefined,
        _department: m.department,
      })),
    [milestones, user?.id]
  );

  const activeCards = tab === "awards" ? awardCards : milestoneCards;

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeCards.filter((c) => {
      const matchesSearch =
        !q || c.name.toLowerCase().includes(q) || c.title.toLowerCase().includes(q);
      const matchesDept = department === "all" || c._department === department;
      return matchesSearch && matchesDept;
    });
  }, [activeCards, search, department]);

  const isLoading = tab === "awards" ? awardsLoading : milestonesLoading;

  const handleTabChange = (next: "awards" | "milestones") => {
    setTab(next);
    setVisible(PAGE_SIZE);
  };

  return (
    <div className="container-page flex flex-col gap-5 pb-8">
      <motion.h1
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white"
      >
        Wall of Fame
      </motion.h1>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTabChange("awards")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition",
              tab === "awards"
                ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
            )}
          >
            <Trophy className="h-4 w-4" />
            Awards {awardCards.length > 0 && `(${awardCards.length})`}
          </button>
          <button
            onClick={() => handleTabChange("milestones")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition",
              tab === "milestones"
                ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
            )}
          >
            <Flag className="h-4 w-4" />
            Milestones {milestoneCards.length > 0 && `(${milestoneCards.length})`}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setVisible(PAGE_SIZE);
              }}
              placeholder="Search Employee, Award and Enter"
              className="w-64 max-w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
          <button
            onClick={() => setShowFilters((s) => !s)}
            aria-label="Filters"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Department</span>
              <select
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  setVisible(PAGE_SIZE);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              {department !== "all" && (
                <button
                  onClick={() => setDepartment("all")}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />
          ))}
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 py-16 text-center dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">No results found</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Try a different search term or filter.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredCards.slice(0, visible).map((card) => (
              <WallOfFameCard key={card.id} item={card} />
            ))}
          </div>

          {visible < filteredCards.length && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="rounded-full border border-slate-300 bg-slate-50 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:border-blue-500 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

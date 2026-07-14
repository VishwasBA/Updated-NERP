import StatsCards from "@/components/dashboard/StatsCards";
import RecognitionFeed from "@/components/dashboard/RecognitionFeed";
import LeaderboardWidget from "@/components/dashboard/LeaderboardWidget";
import QuickActions from "@/components/dashboard/QuickActions";
import HeroCarousel from "@/components/dashboard/HeroCarousel";
import MilestonesPanel from "@/components/dashboard/MilestonesPanel";
import { useDashboardSummary, useMilestoneNotifications } from "@/hooks/useApiData";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { useMemo, lazy, Suspense } from "react";

// PERFORMANCE: these two pull in the full recharts library, which was the
// single biggest contributor to this page's 536KB bundle (recharts alone
// is a large dependency). Index.tsx is the very first page every user
// lands on after login (route "/"), so that weight used to sit directly
// in everyone's critical path. Splitting them into their own chunks lets
// the rest of the dashboard (stats, feed, leaderboard — all lightweight)
// paint immediately while these load in behind a small skeleton.
const RecognitionTrendChart = lazy(() => import("@/components/dashboard/RecognitionTrendChart"));
const TopCategoriesDonut = lazy(() => import("@/components/dashboard/TopCategoriesDonut"));

const ChartSkeleton = () => (
  <div className="h-64 w-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
);

export default function Index() {
  const { user } = useAuth();
  const { data: dashboard, isLoading } = useDashboardSummary();
  const { data: milestones = [], isLoading: milestonesLoading } = useMilestoneNotifications();

  const recentRecognitions = dashboard?.recentRecognitions ?? [];

  const trendData = dashboard?.appreciationsOverTime ?? [];

  const categoryData = useMemo(() => {
    return (dashboard?.topCategories ?? []).map((c) => ({
      name: c.name,
      value: c.count,
    }));
  }, [dashboard?.topCategories]);

  const displayName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="container-page flex flex-col gap-6 pb-6">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
          Welcome Back, {displayName}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {user?.role && user?.department ? `${user.role} · ${user.department}` : "Here's what's happening across your team today."}
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <HeroCarousel />
        <div className="lg:row-span-2">
          <MilestonesPanel items={milestones} isLoading={milestonesLoading} />
        </div>

        <div className="flex flex-col gap-6 min-h-0">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading dashboard...</div>
          ) : (
            <RecognitionFeed items={recentRecognitions} />
          )}
        </div>
      </div>

      <StatsCards summary={dashboard} isLoading={isLoading} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <RecognitionTrendChart data={trendData} />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <TopCategoriesDonut data={categoryData} />
        </Suspense>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <LeaderboardWidget topPerformers={dashboard?.topPerformers ?? []} isLoading={isLoading} />
        <QuickActions />
      </div>
    </div>
  );
}

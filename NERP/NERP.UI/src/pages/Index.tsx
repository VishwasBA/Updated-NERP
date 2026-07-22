import RecognitionFeed from "@/components/dashboard/RecognitionFeed";
import LeaderboardWidget from "@/components/dashboard/LeaderboardWidget";
import QuickActions from "@/components/dashboard/QuickActions";
import HeroCarousel from "@/components/dashboard/HeroCarousel";
import MilestonesPanel from "@/components/dashboard/MilestonesPanel";
import LatestMilestonesPanel from "@/components/dashboard/LatestMilestonesPanel";
import AnnouncementsPanel from "@/components/dashboard/AnnouncementsPanel";
import StatCard from "@/components/dashboard/StatCard";
import MonthlySnapshotCard from "@/components/dashboard/MonthlySnapshotCard";
import MiniCalendar from "@/components/dashboard/MiniCalendar";
import DepartmentOverviewCard from "@/components/dashboard/DepartmentOverviewCard";
import {
  useDashboardSummary,
  useMyMilestones,
  useWallOfFameMilestones,
  useSentRecognitionsCount,
  useReceivedRecognitionsCount,
  useNotifications,
  useAnalyticsOverview,
} from "@/hooks/useApiData";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Send, Heart, Coins, Award, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
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
  <div className="h-64 w-full animate-pulse rounded-[24px] bg-card border border-border" />
);

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Index() {
  const { user } = useAuth();
  const { data: dashboard, isLoading } = useDashboardSummary();
  const { data: milestones = [], isLoading: milestonesLoading } = useMyMilestones();
  const { data: latestMilestones = [], isLoading: latestMilestonesLoading } = useWallOfFameMilestones();
  const { data: sentCount = 0, isLoading: sentLoading } = useSentRecognitionsCount();
  const { data: receivedCount = 0, isLoading: receivedLoading } = useReceivedRecognitionsCount();
  const { data: notifications = [] } = useNotifications();
  const { data: analytics, isLoading: analyticsLoading } = useAnalyticsOverview();

  const recentRecognitions = dashboard?.recentRecognitions ?? [];
  const trendData = dashboard?.appreciationsOverTime ?? [];
  const badgesEarned = milestones.filter((m) => m.earned).length;
  const isManagerOrAdmin = user?.userRole === "manager" || user?.userRole === "admin";

  const categoryData = useMemo(() => {
    return (dashboard?.topCategories ?? []).map((c) => ({
      name: c.name,
      value: c.count,
    }));
  }, [dashboard?.topCategories]);

  const displayName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="container-page flex flex-col gap-6 pb-6">
      {/* Hero greeting + primary CTA */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-foreground">
            {getGreeting()}, {displayName} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user?.role && user?.department
              ? `${user.role} · ${user.department}`
              : "Here's what's happening across your team today."}
          </p>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Recognition Sent"
          value={sentCount}
          icon={<Send className="h-5 w-5" />}
          accent="primary"
          isLoading={sentLoading}
        />
        <StatCard
          label="Recognition Received"
          value={receivedCount}
          icon={<Heart className="h-5 w-5" />}
          accent="accent"
          isLoading={receivedLoading}
        />
        <StatCard
          label="Points Balance"
          value={user?.totalPoints ?? 0}
          icon={<Coins className="h-5 w-5" />}
          accent="warning"
          isLoading={false}
        />
        <StatCard
          label="Badges Earned"
          value={badgesEarned}
          icon={<Award className="h-5 w-5" />}
          accent="success"
          isLoading={milestonesLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <HeroCarousel />
        <div className="lg:row-span-2">
          <MilestonesPanel milestones={milestones} isLoading={milestonesLoading} />
        </div>

        <div className="flex flex-col gap-6 min-h-0">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading dashboard...</div>
          ) : (
            <RecognitionFeed items={recentRecognitions} />
          )}
        </div>
      </div>

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

      {/* Monthly snapshot, calendar, announcements */}
      <div className="grid gap-6 lg:grid-cols-3">
        <MonthlySnapshotCard trend={trendData} isLoading={isLoading} />
        <MiniCalendar milestones={latestMilestones} />
        <AnnouncementsPanel notifications={notifications} />
      </div>

      {/* Department engagement — real data, restricted to managers/admins,
          matching the backend's own [Authorize(Roles="admin,manager")] on
          this endpoint rather than fabricating numbers for employees. */}
      {isManagerOrAdmin && (
        <DepartmentOverviewCard
          departments={analytics?.departmentEngagement ?? []}
          isLoading={analyticsLoading}
        />
      )}

      <LatestMilestonesPanel items={latestMilestones} isLoading={latestMilestonesLoading} />
    </div>
  );
}

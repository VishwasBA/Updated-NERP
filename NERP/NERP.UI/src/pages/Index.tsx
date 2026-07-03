import StatsCards from "@/components/dashboard/StatsCards";
import RecognitionFeed from "@/components/dashboard/RecognitionFeed";
import LeaderboardWidget from "@/components/dashboard/LeaderboardWidget";
import HeroWelcome from "@/components/dashboard/HeroWelcome";
import RecognitionTrendChart from "@/components/dashboard/RecognitionTrendChart";
import TopCategoriesDonut from "@/components/dashboard/TopCategoriesDonut";
import QuickActions from "@/components/dashboard/QuickActions";
import { useDashboardSummary, useRecognitions } from "@/hooks/useApiData";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo } from "react";

export default function Index() {
  const { user } = useAuth();
  const { data: dashboard, isLoading } = useDashboardSummary();
  const { data: recognitions = [] } = useRecognitions();

  const monthlyPoints = dashboard?.monthlyPoints ?? 0;
  const recognitionsCount = dashboard?.recognitionsCount ?? 0;
  const recentRecognitions = dashboard?.recentRecognitions ?? [];
  const currentUserRank = dashboard?.currentUserRank ?? null;

  const trendData = useMemo(() => {
    const now = new Date();
    const months: { label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString("default", { month: "short" });
      const value = recognitions.filter((r) => {
        const rd = new Date(r.createdAt);
        return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
      }).length;
      months.push({ label, value });
    }
    return months;
  }, [recognitions]);

  const categoryData = useMemo(() => {
    const counts = new Map<string, number>();
    recognitions.forEach((r) => {
      const name = r.category?.name ?? "Appreciation";
      counts.set(name, (counts.get(name) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [recognitions]);

  return (
    <div className="container-page flex h-full min-h-0 flex-col gap-6 overflow-y-auto pb-6">
      <HeroWelcome
        name={user?.name}
        avatar={user?.avatar}
        monthlyPoints={monthlyPoints}
        recognitionsCount={recognitionsCount}
        rank={currentUserRank}
      />

      <StatsCards summary={dashboard} isLoading={isLoading} />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-6 min-h-0">
          <RecognitionTrendChart data={trendData} />
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading dashboard...</div>
          ) : (
            <RecognitionFeed items={recentRecognitions} />
          )}
        </div>

        <div className="flex flex-col gap-6 min-h-0">
          <TopCategoriesDonut data={categoryData} />
          <LeaderboardWidget topPerformers={dashboard?.topPerformers ?? []} isLoading={isLoading} />
        </div>
      </div>

      <QuickActions />

      <p className="shrink-0 text-center text-xs text-slate-400 dark:text-slate-500">
        © 2025 Nexer Stars. All rights reserved.
      </p>
    </div>
  );
}

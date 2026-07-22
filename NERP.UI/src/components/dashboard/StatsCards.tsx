import { Card, CardContent } from "@/components/ui/card";
import { Star, Gift, Users, TrendingUp } from "lucide-react";
import { ApiDashboardSummary } from "@/services/api";

interface Props {
  summary?: ApiDashboardSummary | null;
  isLoading?: boolean;
}

export default function StatsCards({ summary, isLoading }: Props) {
  const totalRecognitions = summary?.totalRecognitions ?? 0;
  const totalPoints = summary?.totalPointsAwarded ?? 0;
  const uniqueRecognized = summary?.uniqueRecognizedEmployees ?? 0;
  const activeEmployees = summary?.activeEmployees ?? 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-5 text-center">Loading...</CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: "Total Recognitions",
      value: totalRecognitions,
      subtext: "All time",
      icon: Star,
      iconBg: "bg-blue-500",
      cardBg: "bg-gradient-to-br from-blue-50 to-blue-100/60 dark:from-blue-950/40 dark:to-blue-900/10",
      border: "border-blue-100/80 dark:border-blue-900/40",
    },
    {
      label: "Points Awarded",
      value: totalPoints.toLocaleString(),
      subtext: "All time",
      icon: Gift,
      iconBg: "bg-violet-500",
      cardBg: "bg-gradient-to-br from-violet-50 to-violet-100/60 dark:from-violet-950/40 dark:to-violet-900/10",
      border: "border-violet-100/80 dark:border-violet-900/40",
    },
    {
      label: "Employees Recognized",
      value: uniqueRecognized,
      subtext: "All time",
      icon: Users,
      iconBg: "bg-emerald-500",
      cardBg: "bg-gradient-to-br from-emerald-50 to-emerald-100/60 dark:from-emerald-950/40 dark:to-emerald-900/10",
      border: "border-emerald-100/80 dark:border-emerald-900/40",
    },
    {
      label: "Active Employees",
      value: activeEmployees,
      subtext: "Across organization",
      icon: TrendingUp,
      iconBg: "bg-sky-500",
      cardBg: "bg-gradient-to-br from-sky-50 to-sky-100/60 dark:from-sky-950/40 dark:to-sky-900/10",
      border: "border-sky-100/80 dark:border-sky-900/40",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className={`relative overflow-hidden border ${stat.border} ${stat.cardBg} shadow-sm rounded-2xl transition-transform hover:scale-[1.02]`}
        >
          <stat.icon className="pointer-events-none absolute -bottom-3 -right-3 h-24 w-24 text-slate-900/5 dark:text-white/5" strokeWidth={1.25} />
          <CardContent className="relative p-5">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.iconBg} text-white shadow-sm`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{stat.value}</h2>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{stat.subtext}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

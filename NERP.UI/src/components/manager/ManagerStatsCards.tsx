import { Card, CardContent } from "@/components/ui/card";
import { Users, Award, UserX, Clock, Coins } from "lucide-react";
import { ApiManagerDashboard } from "@/services/api";

interface Props {
  stats?: ApiManagerDashboard["stats"];
  isLoading?: boolean;
}

export default function ManagerStatsCards({ stats, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="rounded-2xl">
            <CardContent className="p-5 text-center text-sm text-muted-foreground">Loading...</CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const items = [
    {
      label: "Total Team Members",
      value: stats?.totalTeamMembers ?? 0,
      icon: Users,
      iconBg: "bg-blue-500",
      cardBg: "bg-gradient-to-br from-blue-50 to-blue-100/60 dark:from-blue-950/40 dark:to-blue-900/10",
      border: "border-blue-100/80 dark:border-blue-900/40",
    },
    {
      label: "Appreciated Employees",
      value: stats?.appreciatedEmployees ?? 0,
      icon: Award,
      iconBg: "bg-emerald-500",
      cardBg: "bg-gradient-to-br from-emerald-50 to-emerald-100/60 dark:from-emerald-950/40 dark:to-emerald-900/10",
      border: "border-emerald-100/80 dark:border-emerald-900/40",
    },
    {
      label: "Without Recognition",
      value: stats?.employeesWithoutRecognition ?? 0,
      icon: UserX,
      iconBg: "bg-rose-500",
      cardBg: "bg-gradient-to-br from-rose-50 to-rose-100/60 dark:from-rose-950/40 dark:to-rose-900/10",
      border: "border-rose-100/80 dark:border-rose-900/40",
    },
    {
      label: "Pending Nominations",
      value: stats?.pendingNominations ?? 0,
      icon: Clock,
      iconBg: "bg-amber-500",
      cardBg: "bg-gradient-to-br from-amber-50 to-amber-100/60 dark:from-amber-950/40 dark:to-amber-900/10",
      border: "border-amber-100/80 dark:border-amber-900/40",
    },
    {
      label: "Total Team Points",
      value: (stats?.totalTeamPoints ?? 0).toLocaleString(),
      icon: Coins,
      iconBg: "bg-violet-500",
      cardBg: "bg-gradient-to-br from-violet-50 to-violet-100/60 dark:from-violet-950/40 dark:to-violet-900/10",
      border: "border-violet-100/80 dark:border-violet-900/40",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {items.map((stat) => (
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

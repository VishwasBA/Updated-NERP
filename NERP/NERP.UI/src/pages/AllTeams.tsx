import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, ArrowLeft, Users, Award, UserX, Clock, Coins } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/avatar";
import { useAllTeams, useTeamForManager } from "@/hooks/useApiData";
import ManagerStatsCards from "@/components/manager/ManagerStatsCards";
import EmployeesWithoutRecognitionTable from "@/components/manager/EmployeesWithoutRecognitionTable";
import TopBottomPerformers from "@/components/manager/TopBottomPerformers";
import RecentTeamAppreciations from "@/components/manager/RecentTeamAppreciations";

export default function AllTeams() {
  const [selectedManagerId, setSelectedManagerId] = useState<number | null>(null);

  const { data: teams = [], isLoading } = useAllTeams();
  const { data: detail, isLoading: detailLoading } = useTeamForManager(selectedManagerId);

  const selectedManager = teams.find((t) => t.managerId === selectedManagerId);

  if (selectedManagerId && selectedManager) {
    const members = detail?.members ?? [];
    const employeesWithoutRecognition = detail?.employeesWithoutRecognition ?? [];

    return (
      <div className="container-page flex flex-col gap-6 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-3"
        >
          <Button variant="outline" size="icon" onClick={() => setSelectedManagerId(null)} aria-label="Back to all teams">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <UserAvatar name={selectedManager.managerName} size="h-11 w-11" fallbackClassName="text-sm font-bold" />
          <div>
            <h1 className="text-xl font-bold text-slate-950 dark:text-white">{selectedManager.managerName}'s Team</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{selectedManager.department}</p>
          </div>
        </motion.div>

        <ManagerStatsCards stats={detail?.stats} isLoading={detailLoading} />

        {!detailLoading && members.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 py-16 text-center dark:border-slate-800">
            <Users className="h-8 w-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No one reports to this manager yet.</p>
          </div>
        ) : (
          <>
            <RecentTeamAppreciations items={detail?.recentAppreciations ?? []} isLoading={detailLoading} />
            <EmployeesWithoutRecognitionTable items={employeesWithoutRecognition} isLoading={detailLoading} />
            <TopBottomPerformers
              topPerformers={detail?.topPerformers ?? []}
              bottomPerformers={detail?.bottomPerformers ?? []}
              isLoading={detailLoading}
            />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="container-page flex flex-col gap-6 pb-6">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
          <Building2 className="h-6 w-6 text-primary" /> All Teams
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Every manager in the org and how their team is doing — click into any team for the full breakdown.
        </p>
      </motion.div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            No managers found yet. Assign someone the "manager" role in User Management to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {teams.map((t) => (
            <Card
              key={t.managerId}
              className="cursor-pointer rounded-2xl border-slate-200 transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800"
              onClick={() => setSelectedManagerId(t.managerId)}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <UserAvatar name={t.managerName} size="h-10 w-10" fallbackClassName="text-xs font-bold" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-950 dark:text-white">{t.managerName}</p>
                    <p className="truncate text-xs text-muted-foreground">{t.department}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-blue-500" />
                    <span className="font-semibold text-slate-900 dark:text-white">{t.teamSize}</span>
                    <span className="text-muted-foreground">members</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="font-semibold text-slate-900 dark:text-white">{t.appreciatedEmployees}</span>
                    <span className="text-muted-foreground">appreciated</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UserX className="h-3.5 w-3.5 text-rose-500" />
                    <span className="font-semibold text-slate-900 dark:text-white">{t.employeesWithoutRecognition}</span>
                    <span className="text-muted-foreground">unrecognized</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    <span className="font-semibold text-slate-900 dark:text-white">{t.pendingNominations}</span>
                    <span className="text-muted-foreground">pending</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                  <Coins className="h-3.5 w-3.5 text-violet-500" />
                  <span className="font-semibold text-slate-900 dark:text-white">{t.totalTeamPoints.toLocaleString()}</span>
                  <span className="text-muted-foreground">total team points</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

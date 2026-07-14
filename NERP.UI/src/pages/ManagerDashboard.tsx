import { motion } from "framer-motion";
import { Users, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useManagerDashboard } from "@/hooks/useApiData";
import ManagerStatsCards from "@/components/manager/ManagerStatsCards";
import EmployeesWithoutRecognitionTable from "@/components/manager/EmployeesWithoutRecognitionTable";
import TopBottomPerformers from "@/components/manager/TopBottomPerformers";
import RecentTeamAppreciations from "@/components/manager/RecentTeamAppreciations";
import ManageTeamPanel from "@/components/manager/ManageTeamPanel";

function toCsvValue(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export default function ManagerDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useManagerDashboard();

  const members = data?.members ?? [];
  const employeesWithoutRecognition = data?.employeesWithoutRecognition ?? [];

  const handleExport = () => {
    const header = ["Name", "Department", "Points", "Appreciations Given", "Appreciations Received"];
    const rows = members.map((m) => [m.name, m.department, m.points, m.appreciationsGiven, m.appreciationsReceived]);
    const csv = [header, ...rows].map((row) => row.map(toCsvValue).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `team-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container-page flex flex-col gap-6 pb-6">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            <Users className="h-6 w-6 text-primary" /> Manager Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {user?.name ? `${user.name.split(" ")[0]}'s` : "Your"} view of employees reporting directly to you.
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleExport} disabled={members.length === 0}>
          <Download className="h-4 w-4" /> Export Excel
        </Button>
      </motion.div>

      <ManagerStatsCards stats={data?.stats} isLoading={isLoading} />

      {!isLoading && members.length === 0 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 py-16 text-center dark:border-slate-800">
            <Users className="h-8 w-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No one reports to you yet.</p>
            <p className="text-xs text-muted-foreground">Use "Add Employee" to start building your team.</p>
          </div>
          <ManageTeamPanel members={members} />
        </div>
      ) : (
        <>
          <RecentTeamAppreciations items={data?.recentAppreciations ?? []} isLoading={isLoading} />

          <EmployeesWithoutRecognitionTable items={employeesWithoutRecognition} isLoading={isLoading} />

          <TopBottomPerformers
            topPerformers={data?.topPerformers ?? []}
            bottomPerformers={data?.bottomPerformers ?? []}
            isLoading={isLoading}
          />

          <ManageTeamPanel members={members} />
        </>
      )}
    </div>
  );
}

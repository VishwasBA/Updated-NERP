import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Building2,
  Coins,
  Award,
  Heart,
  Send,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useEmployees, useOrgRecognitions, useEmployeeMilestones } from "@/hooks/useApiData";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/avatar";
import RecognitionCard from "@/components/dashboard/RecognitionCard";
import StatCard from "@/components/dashboard/StatCard";
import MilestonesPanel from "@/components/dashboard/MilestonesPanel";
import { cn, getLocationFlag } from "@/lib/utils";

function lastNMonthLabels(n: number) {
  const labels: { label: string; year: number; month: number }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push({ label: d.toLocaleDateString(undefined, { month: "short" }), year: d.getFullYear(), month: d.getMonth() });
  }
  return labels;
}

export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const employeeId = Number(id);
  const { user } = useAuth();
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const { data: recognitions = [], isLoading: recognitionsLoading } = useOrgRecognitions();
  const { data: milestones = [], isLoading: milestonesLoading } = useEmployeeMilestones(employeeId);
  const [filter, setFilter] = useState<"received" | "sent">("received");

  const employee = useMemo(
    () => employees.find((e) => e.id === employeeId),
    [employees, employeeId]
  );
  const isMe = employeeId === user?.id;

  const received = useMemo(
    () => recognitions.filter((r) => r.toEmployee?.id === employeeId),
    [recognitions, employeeId]
  );
  const sent = useMemo(
    () => recognitions.filter((r) => r.fromEmployee?.id === employeeId),
    [recognitions, employeeId]
  );

  const trend = useMemo(() => {
    const months = lastNMonthLabels(6);
    return months.map(({ label, year, month }) => ({
      label,
      value: received.filter((r) => {
        const d = new Date(r.createdAt);
        return d.getFullYear() === year && d.getMonth() === month;
      }).length,
    }));
  }, [received]);

  const maxTrend = Math.max(1, ...trend.map((t) => t.value));
  const displayed = filter === "received" ? received : sent;
  const flag = getLocationFlag(employee?.location);

  if (employeesLoading) {
    return (
      <div className="container-page pb-6">
        <div className="h-48 w-full animate-pulse rounded-[24px] bg-card border border-border" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="container-page pb-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-base font-semibold text-foreground">Employee not found</p>
            <p className="text-sm text-muted-foreground">This person may no longer be with the organization.</p>
            <Button asChild variant="outline" className="mt-2 gap-2 rounded-full">
              <Link to="/directory">
                <ArrowLeft className="h-4 w-4" />
                Back to Directory
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container-page flex flex-col gap-6 pb-6">
      <Link
        to="/directory"
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Directory
      </Link>

      {/* Cover header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="overflow-hidden">
          <div className="relative h-36 w-full bg-gradient-to-br from-primary via-secondary to-accent sm:h-44">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.25),transparent_45%)]" />
          </div>
          <CardContent className="relative flex flex-col gap-4 p-6 pt-0 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col items-center gap-3 -mt-12 sm:flex-row sm:items-end">
              <UserAvatar
                name={employee.name}
                size="h-24 w-24 border-4 border-card shadow-card"
                fallbackClassName="text-2xl font-bold"
              />
              <div className="text-center sm:pb-1 sm:text-left">
                <h1 className="text-xl font-bold text-foreground">{employee.name}</h1>
                <p className="text-sm text-muted-foreground">{employee.role}</p>
                <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    <Building2 className="h-3 w-3" />
                    {employee.department}
                  </span>
                  {employee.location && (
                    <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {flag} {employee.location}
                    </span>
                  )}
                  {employee.managerName && (
                    <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      <UserRound className="h-3 w-3" />
                      Reports to {employee.managerName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {!isMe && (
              <Button
                asChild
                className="gap-2 rounded-full bg-primary px-5 font-semibold text-primary-foreground shadow-glow-primary hover:bg-primary/90"
              >
                <Link to="/appreciate" state={{ employeeId: employee.id }}>
                  <Heart className="h-4 w-4" />
                  Appreciate
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Recognition Score"
          value={employee.totalPoints}
          icon={<Coins className="h-5 w-5" />}
          accent="warning"
        />
        <StatCard
          label="Awards Received"
          value={employee.nominationCount ?? 0}
          icon={<Award className="h-5 w-5" />}
          accent="accent"
          isLoading={false}
        />
        <StatCard
          label="Recognitions Received"
          value={received.length}
          icon={<Heart className="h-5 w-5" />}
          accent="primary"
          isLoading={recognitionsLoading}
        />
        <StatCard
          label="Recognitions Sent"
          value={sent.length}
          icon={<Send className="h-5 w-5" />}
          accent="success"
          isLoading={recognitionsLoading}
        />
      </div>

      {/* Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-[18px] w-[18px] text-primary" />
            Recognition Trend
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {recognitionsLoading ? (
            <div className="h-32 animate-pulse rounded-2xl bg-muted" />
          ) : (
            <div className="flex items-end gap-3">
              {trend.map((t, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">{t.value}</span>
                  <div
                    className={cn(
                      "w-full rounded-t-lg transition-all",
                      i === trend.length - 1 ? "bg-primary" : "bg-muted"
                    )}
                    style={{ height: `${Math.max(6, (t.value / maxTrend) * 96)}px` }}
                  />
                  <span className="text-[11px] text-muted-foreground">{t.label}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Achievements */}
      <MilestonesPanel
        milestones={milestones}
        isLoading={milestonesLoading}
        title={isMe ? "Your Badges" : `${employee.name.split(" ")[0]}'s Badges`}
        showViewAll={isMe}
      />

      {/* Recognition history */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Recognition History</CardTitle>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter("received")}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold transition",
                filter === "received"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-muted/60 text-foreground hover:bg-muted"
              )}
            >
              Received ({received.length})
            </button>
            <button
              onClick={() => setFilter("sent")}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold transition",
                filter === "sent"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-muted/60 text-foreground hover:bg-muted"
              )}
            >
              Sent ({sent.length})
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {recognitionsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
              <Heart className="h-7 w-7 text-muted-foreground/40" />
              <p className="text-sm">
                No {filter === "received" ? "recognitions received" : "recognitions sent"} yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayed.slice(0, 10).map((r) => (
                <RecognitionCard key={r.id} item={r} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

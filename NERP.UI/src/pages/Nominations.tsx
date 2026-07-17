import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/avatar";
import { Award, Lock, ArrowRight, Heart } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  useEmployees,
  useRecentApprovedNominations,
} from "@/hooks/useApiData";
import { Button } from "@/components/ui/button";

/** API returns category as an object {id,name,...} — safely extract name */
function safeCatName(category: unknown): string {
  if (!category) return "";
  if (typeof category === "string") return category;
  if (typeof category === "object" && category !== null && "name" in category) {
    return String((category as { name: unknown }).name);
  }
  return "";
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Nominations() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const { data: recentNominations = [], isLoading: recentLoading } = useRecentApprovedNominations(4);

  // Deep-linked from the Manager Dashboard's "Recognize" action on an
  // under-recognized team member — pre-selects them in the wizard.
  const prefillEmployeeId = (location.state as { employeeId?: number } | null)?.employeeId ?? null;

  const isManager = user?.userRole === "cu_manager" || user?.userRole === "bu_manager" || user?.userRole === "admin";

  if (!isManager) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card className="glass-card py-16 text-center">
          <CardContent>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Lock className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="mb-2 text-2xl font-bold">Manager Access Required</h2>
            <p className="text-muted-foreground">
              Only managers and admins can nominate employees for award categories.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (employeesLoading || recentLoading) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card className="glass-card py-16 text-center">
          <CardContent>
            <p className="text-muted-foreground">Loading nominations dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container-page space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            Nominate Dashboard
            <Award className="h-7 w-7 text-primary" />
          </h1>
          <p className="mt-1 text-muted-foreground">Recognize outstanding employees with formal nominations and appreciations</p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Card 1: Send Appreciation */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-950 p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between h-full group hover:border-pink-200 dark:hover:border-pink-900/50">
          <CardContent className="p-0 flex flex-col h-full justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-pink-50 dark:bg-pink-950/30 p-3 text-pink-600 dark:text-pink-400 group-hover:scale-110 transition duration-200 shrink-0">
                <Heart className="h-6 w-6 fill-current" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Send Appreciation</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Recognize employees instantly through Kudos/Appreciation.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-2">
              <Button
                onClick={() => navigate("/appreciate", { state: { employeeId: prefillEmployeeId } })}
                className="w-full sm:w-auto bg-pink-600 text-white hover:bg-pink-700 font-semibold gap-1.5 rounded-xl transition"
              >
                Go to Appreciation <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Create Nomination */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-950 p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between h-full group hover:border-indigo-200 dark:hover:border-indigo-900/50">
          <CardContent className="p-0 flex flex-col h-full justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 p-3 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition duration-200 shrink-0">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Create Nomination</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Nominate employees for Spot Awards and Performance Awards.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-2">
              <Button
                onClick={() => navigate("/nominate", { state: { employeeId: prefillEmployeeId } })}
                className="w-full sm:w-auto bg-indigo-600 text-white hover:bg-indigo-700 font-semibold gap-1.5 rounded-xl transition"
              >
                Create Nomination <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Approved Nominations */}
      <div className="border-t border-border pt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <span>🏆</span> Recent Approved Nominations
          </h2>
        </div>

        {recentNominations.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">No approved nominations yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {recentNominations.map((item, i) => {
              const catName = safeCatName(item.category) || safeCatName(item.categoryId);
              const catIcon = item.category?.icon ?? "🏆";

              const NOM_CAT_CFG: Record<string, { bg: string; color: string }> = {
                "Star of the Month": { bg: "#FEF3C7", color: "#D97706" },
                "Employee of the Month": { bg: "#F3E8FF", color: "#7C3AED" },
                "Innovation Champion": { bg: "#E0F2FE", color: "#0284C7" },
              };
              const cfg = catName ? NOM_CAT_CFG[catName] : null;
              const badgeBg = cfg?.bg ?? "#F1F5F9";
              const badgeColor = cfg?.color ?? "#475569";

              const fromEmp = employees.find((e) => e.id === item.fromEmployee?.id);
              const fromName = fromEmp?.name ?? item.fromEmployee?.name ?? "";
              const fromDept = fromEmp?.department ?? fromEmp?.role ?? "";
              const fromAvatar = fromEmp?.avatar ?? item.fromEmployee?.avatar;

              const toEmp = employees.find((e) => e.id === item.toEmployee?.id);
              const toName = toEmp?.name ?? item.toEmployee?.name ?? "";
              const toDept = toEmp?.department ?? toEmp?.role ?? "";
              const toAvatar = toEmp?.avatar ?? item.toEmployee?.avatar;

              const msgText = typeof item.message === "string" ? item.message : "";
              const timeLabel = timeAgo(item.createdAt ?? "");

              return (
                <Card key={item.id ?? i} className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                      <div className="flex min-w-[52px] flex-col items-center gap-0.5">
                        <UserAvatar name={fromName} avatar={fromAvatar} size="h-8 w-8" fallbackClassName="text-[10px]" />
                        <span className="text-center text-[10px] leading-tight text-muted-foreground">{fromName}</span>
                        <span className="text-center text-[10px] leading-tight text-muted-foreground">{fromDept}</span>
                      </div>

                      <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />

                      <div className="flex min-w-[52px] flex-col items-center gap-0.5">
                        <UserAvatar name={toName} avatar={toAvatar} size="h-8 w-8" fallbackClassName="text-[10px]" />
                        <span className="text-center text-[10px] leading-tight text-muted-foreground">{toName}</span>
                        <span className="text-center text-[10px] leading-tight text-muted-foreground">{toDept}</span>
                      </div>

                      {catName && (
                        <div
                          style={{ background: badgeBg, color: badgeColor }}
                          className="inline-flex flex-shrink-0 items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium"
                        >
                          <span className="inline-flex text-xs">{catIcon}</span>
                          {catName}
                        </div>
                      )}

                      {item.points > 0 && (
                        <div className="inline-flex flex-shrink-0 items-center rounded border border-indigo-100 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 dark:border-indigo-900/30 dark:bg-indigo-950/40 dark:text-indigo-400">
                          +{item.points} pts
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{msgText}</p>
                      </div>

                      <span className="flex-shrink-0 self-start whitespace-nowrap text-[10px] text-muted-foreground">
                        {timeLabel}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

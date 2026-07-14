import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/avatar";
import { Award, Lock, ArrowRight } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  useEmployees,
  useAwardCategories,
  useCreateRecognition,
  useRecentApprovedNominations,
} from "@/hooks/useApiData";
import { toast } from "sonner";
import NominationWizard from "@/components/nomination/NominationWizard";

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
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const { data: categories = [], isLoading: categoriesLoading } = useAwardCategories();
  const { data: recentNominations = [] } = useRecentApprovedNominations(4);
  const createMutation = useCreateRecognition();

  // Deep-linked from the Manager Dashboard's "Nominate" action on an
  // under-recognized team member — pre-selects them in the wizard.
  const prefillEmployeeId = (location.state as { employeeId?: number } | null)?.employeeId ?? null;

  const isManager = user?.userRole === "manager" || user?.userRole === "admin";
  const managerCategories = categories.filter((c) => c.managerOnly);

  const handleNominate = async ({
    toEmployeeId,
    categoryId,
    message,
  }: {
    toEmployeeId: number;
    categoryId: number;
    message: string;
  }) => {
    try {
      await createMutation.mutateAsync({
        toEmployeeId,
        message,
        categoryId,
        type: "nomination",
      });
      toast.success("Nomination submitted for approval! 🏆");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit nomination";
      toast.error(msg);
      throw err;
    }
  };

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

  if (employeesLoading || categoriesLoading) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card className="glass-card py-16 text-center">
          <CardContent>
            <p className="text-muted-foreground">Loading nomination form...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container-page space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          New Nomination
          <Award className="h-7 w-7 text-primary" />
        </h1>
        <p className="mt-1 text-muted-foreground">Recognize outstanding employees with formal nominations</p>
      </div>

      <NominationWizard
        heading="New Nomination"
        categories={managerCategories}
        employees={employees}
        currentUserId={user?.id}
        isSubmitting={createMutation.isPending}
        submitLabel="Submit Nomination"
        successTitle="Nomination Submitted!"
        successMessage="The nomination will be reviewed for approval before it's added to the Wall of Fame."
        footerNote="Your nomination will be sent to the admin for approval."
        onSubmit={handleNominate}
        initialEmployeeId={prefillEmployeeId}
      />

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

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, Star, Trophy, ArrowRight, Heart } from "lucide-react";
import {
  usePendingApprovals,
  useMySentNominations,
  useBuDecision,
  useHrDecision
} from "@/hooks/useApiData";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const getTenureMonths = (joiningDateStr?: string) => {
  if (!joiningDateStr) return 0;
  const joinDate = new Date(joiningDateStr);
  const diffTime = Date.now() - joinDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return Number((diffDays / 30.4375).toFixed(1));
};

export default function ApprovalsCenter() {
  const { user } = useAuth();
  const userRole = user?.userRole;

  const isCuManager = userRole === "cu_manager";
  const isBuManager = userRole === "bu_manager";
  const isAdmin = userRole === "admin";
  const isApprover = isBuManager || isAdmin;

  // Fetch pending approvals for BU Manager or Admin
  const { data: pendingApprovals = [], isLoading: pendingLoading } = usePendingApprovals();

  // Fetch sent nominations for CU Manager
  const { data: sentNominations = [], isLoading: sentLoading } = useMySentNominations();

  const buDecisionMutation = useBuDecision();
  const hrDecisionMutation = useHrDecision();

  const [decisionComments, setDecisionComments] = useState<Record<number, string>>({});

  const isLoading = isCuManager ? sentLoading : pendingLoading;

  const handleBuDecision = async (id: number, decision: "approve" | "reject" | "shortlist") => {
    try {
      const comments = decisionComments[id] || "";
      await buDecisionMutation.mutateAsync({ id, decision, comments });
      setDecisionComments((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (decision === "approve") {
        toast.success("Spot Award nomination approved! 🎉");
      } else if (decision === "shortlist") {
        toast.success("Performance nomination shortlisted! 🚀");
      } else {
        toast.success("Nomination rejected ❌");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Action failed";
      toast.error(message);
    }
  };

  const handleHrDecision = async (id: number, decision: "select" | "reject") => {
    try {
      const comments = decisionComments[id] || "";
      await hrDecisionMutation.mutateAsync({ id, decision, comments });
      setDecisionComments((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (decision === "select") {
        toast.success("Award winner selected! 🏆");
      } else {
        toast.success("Nomination rejected ❌");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Action failed";
      toast.error(message);
    }
  };

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case "Approved":
      case "Approved Winner":
      case "Winner":
      case "approved":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/50";
      case "Rejected":
      case "Not Selected":
        return "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/50";
      case "BU Shortlisted":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200/50";
      case "Pending BU Approval":
      case "Pending BU Review":
      default:
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/50";
    }
  };

  if (isLoading) {
    return (
      <Card className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-950 dark:border-slate-800 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-900">
          <CardTitle className="text-lg font-bold text-slate-950 dark:text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary animate-pulse" /> Approvals Center
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Loading approval records...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-950 dark:border-slate-800 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-900">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-bold text-slate-950 dark:text-white">
            {isCuManager ? "Submitted Nominations" : "Approvals Center"}
          </CardTitle>
        </div>
        {!isCuManager && (
          <Badge className="bg-primary/10 text-primary border-none rounded-full px-2.5 py-0.5 text-xs font-semibold">
            {pendingApprovals.length} Pending
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* CU MANAGER: READ-ONLY SUBMITTED NOMINATIONS LIST */}
        {isCuManager && (
          <>
            {sentNominations.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                You have not submitted any nominations yet.
              </p>
            ) : (
              <div className="space-y-4">
                {sentNominations.map((r) => {
                  const awardName = r.category?.name ?? r.customCategory ?? "Spot Award";
                  const isSpot = r.category?.awardType === "spot" || !r.categoryId;
                  return (
                    <div
                      key={r.id}
                      className="flex flex-col gap-3 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 bg-slate-50/30 dark:bg-slate-900/10"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <UserAvatar
                            name={r.toEmployee?.name}
                            avatar={r.toEmployee?.avatar}
                            size="h-9 w-9"
                            fallbackClassName="text-xs"
                          />
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5 text-sm">
                              <span className="text-slate-500">Nominated</span>
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {r.toEmployee?.name}
                              </span>
                              <span className="text-slate-400">for</span>
                              <Badge
                                variant="secondary"
                                className="bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                              >
                                {r.category?.icon ?? "🏅"} {awardName} · +{r.points} pts
                              </Badge>
                            </div>
                            <p className="mt-1.5 text-xs italic text-slate-500 dark:text-slate-400 line-clamp-2">
                              "{r.message}"
                            </p>
                            <p className="mt-1 text-[10px] text-slate-400">
                              Submitted on {new Date(r.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn("self-start capitalize font-semibold border", getStatusBadgeStyles(r.status))}
                        >
                          {r.status}
                        </Badge>
                      </div>

                      {/* Display Audits if they exist */}
                      {r.audits && r.audits.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                            Nomination Lifecycle Audits
                          </p>
                          <div className="space-y-1">
                            {r.audits.map((audit) => (
                              <div
                                key={audit.id}
                                className="text-[11px] flex flex-wrap gap-x-2 text-slate-500 items-center"
                              >
                                <span className="font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.2 rounded text-[9px]">
                                  {audit.action}
                                </span>
                                <span>
                                  by {audit.performedBy} ({audit.role})
                                </span>
                                {audit.comments && (
                                  <span className="text-slate-400 dark:text-slate-500 italic">
                                    "{audit.comments}"
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* BU MANAGER & ADMIN: PENDING APPROVALS QUEUE WITH DECISIONS */}
        {isApprover && (
          <>
            {pendingApprovals.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                No pending nominations requiring your review.
              </p>
            ) : (
              <div className="space-y-4">
                {pendingApprovals.map((r) => {
                  const isSpot = r.category?.awardType === "spot" || !r.categoryId;
                  const isPerf = r.category?.awardType === "performance";
                  const isRS = r.category?.name?.includes("Rising Star") || r.category?.id === 15;
                  const tenure = r.toEmployee?.joiningDate ? getTenureMonths(r.toEmployee.joiningDate) : null;
                  const awardName = r.category?.name ?? r.customCategory ?? "Spot Award";

                  return (
                    <div
                      key={r.id}
                      className="flex flex-col gap-3 rounded-xl border border-slate-200/80 px-4 py-4 hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-900/10 bg-white dark:bg-slate-950 transition duration-150"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                        <UserAvatar
                          name={r.fromEmployee?.name}
                          avatar={r.fromEmployee?.avatar}
                          size="h-9 w-9"
                          fallbackClassName="text-xs"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
                            <span className="font-semibold text-blue-600 dark:text-sky-400">
                              {r.fromEmployee?.name}
                            </span>
                            <span className="text-slate-500">nominated</span>
                            <span className="font-semibold text-blue-600 dark:text-sky-400">
                              {r.toEmployee?.name}
                            </span>
                            <Badge
                              variant="secondary"
                              className="gap-1 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                            >
                              {r.category?.icon ?? "🏅"} {awardName} · +{r.points} pts
                            </Badge>
                            {r.awardCycle && (
                              <Badge
                                variant="outline"
                                className="border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-300"
                              >
                                Cycle: {r.awardCycle}
                              </Badge>
                            )}
                            <Badge
                              className={cn(
                                "border-none text-xs font-semibold",
                                isSpot
                                  ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/20 dark:text-cyan-400"
                                  : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400"
                              )}
                            >
                              {isSpot ? "Spot Award" : "Performance"}
                            </Badge>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 dark:bg-slate-900/40 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-900">
                            "{r.message}"
                          </p>

                          {isRS && tenure !== null && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                              <span>ℹ️</span> Nominee Tenure: <strong>{tenure} months</strong> (Joined on{" "}
                              {r.toEmployee?.joiningDate})
                            </p>
                          )}

                          {r.audits && r.audits.length > 0 && (
                            <div className="mt-3 border-t border-slate-100 dark:border-slate-800 pt-2">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                                Nomination Lifecycle Audits
                              </p>
                              <div className="space-y-1">
                                {r.audits.map((audit) => (
                                  <div
                                    key={audit.id}
                                    className="text-xs flex flex-wrap gap-x-2 text-slate-500 items-center"
                                  >
                                    <span className="font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.2 rounded text-[10px]">
                                      {audit.action}
                                    </span>
                                    <span>
                                      by {audit.performedBy} ({audit.role})
                                    </span>
                                    {audit.comments && (
                                      <span className="text-slate-400 dark:text-slate-500 italic">
                                        "{audit.comments}"
                                      </span>
                                    )}
                                    <span className="text-[10px] text-slate-400 ml-auto">
                                      {new Date(audit.createdDate).toLocaleDateString()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                        <input
                          type="text"
                          placeholder="Add comments / reasons for decision..."
                          value={decisionComments[r.id] || ""}
                          onChange={(e) =>
                            setDecisionComments((prev) => ({ ...prev, [r.id]: e.target.value }))
                          }
                          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        />
                        <div className="flex gap-2 shrink-0 justify-end">
                          {/* BU Manager Decision Controls */}
                          {isSpot && isBuManager && r.status === "Pending BU Approval" && (
                            <>
                              <button
                                onClick={() => handleBuDecision(r.id, "approve")}
                                className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                              >
                                Approve Spot
                              </button>
                              <button
                                onClick={() => handleBuDecision(r.id, "reject")}
                                className="px-3 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {isPerf && isBuManager && r.status === "Pending BU Review" && (
                            <>
                              <button
                                onClick={() => handleBuDecision(r.id, "shortlist")}
                                className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                              >
                                Shortlist
                              </button>
                              <button
                                onClick={() => handleBuDecision(r.id, "reject")}
                                className="px-3 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {/* Admin (HR) Decision Controls */}
                          {isPerf && isAdmin && r.status === "BU Shortlisted" && (
                            <>
                              <button
                                onClick={() => handleHrDecision(r.id, "select")}
                                className="px-3 py-1.5 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
                              >
                                Select Winner
                              </button>
                              <button
                                onClick={() => handleHrDecision(r.id, "reject")}
                                className="px-3 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

import { Users, CheckCircle2, XCircle } from "lucide-react";
import { UserAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { usePeerReviewQueue, usePeerApprove, usePeerReject } from "@/hooks/useApiData";
import { toast } from "sonner";

// Employee of the Quarter and Rising Star need a peer manager's review
// before Admin/HR gives the final approval. This queue shows every other
// manager's nomination still waiting on that step — the backend already
// excludes a manager's own submissions, so nobody can review themselves.
export default function PeerReviewQueue() {
  const { data: queue = [], isLoading } = usePeerReviewQueue();
  const approve = usePeerApprove();
  const reject = usePeerReject();

  if (isLoading) {
    return <div className="h-32 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />;
  }

  if (queue.length === 0) return null;

  const handleApprove = (id: number) => {
    approve.mutate(id, {
      onSuccess: () => toast.success("Sent on to Admin for final approval."),
      onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Failed to approve"),
    });
  };

  const handleReject = (id: number) => {
    reject.mutate(id, {
      onSuccess: () => toast.success("Nomination rejected."),
      onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Failed to reject"),
    });
  };

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
      <div className="mb-3 flex items-center gap-2">
        <Users className="h-4 w-4 text-blue-600 dark:text-sky-400" />
        <h3 className="text-base font-bold text-slate-950 dark:text-white">Peer Review Queue</h3>
        <Badge variant="secondary">{queue.length} awaiting your review</Badge>
      </div>

      <div className="flex flex-col gap-3">
        {queue.map((r) => (
          <div
            key={r.id}
            className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-start"
          >
            <UserAvatar name={r.fromEmployee?.name} size="h-9 w-9" fallbackClassName="text-xs" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-sm">
                <span className="font-semibold text-blue-600 dark:text-sky-400">{r.fromEmployee?.name}</span>
                <span className="text-slate-600 dark:text-slate-300">nominated</span>
                <span className="font-semibold text-blue-600 dark:text-sky-400">{r.toEmployee?.name}</span>
                {r.category && (
                  <Badge variant="secondary" className="ml-1 gap-1">
                    {r.category.icon} {r.category.name} · +{r.points} pts
                  </Badge>
                )}
              </div>
              <p className="mt-1.5 whitespace-pre-wrap rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                "{r.message}"
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => handleApprove(r.id)}
                disabled={approve.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-200 disabled:opacity-50 dark:bg-emerald-950/40 dark:text-emerald-300"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Approve
              </button>
              <button
                onClick={() => handleReject(r.id)}
                disabled={reject.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-200 disabled:opacity-50 dark:bg-rose-950/40 dark:text-rose-300"
              >
                <XCircle className="h-3.5 w-3.5" /> Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

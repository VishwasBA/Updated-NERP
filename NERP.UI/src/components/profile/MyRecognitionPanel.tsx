import { useEffect, useState } from "react";
import { Search, Download, CheckCircle2, XCircle } from "lucide-react";
import { UserAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { recognitionsApi, ApiRecognition } from "@/services/api";
import { useApproveRecognition, useRejectRecognition } from "@/hooks/useApiData";
import AppreciationCard from "@/components/AppreciationCard";
import AwardCertificate from "@/components/AwardCertificate";

interface Props {
  initialSubTab?: "received" | "given";
}

function PendingNominationsReview() {
  const [pending, setPending] = useState<ApiRecognition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const approve = useApproveRecognition();
  const reject = useRejectRecognition();

  const fetchPending = async () => {
    try {
      // Admins calling GetMy without a direction get every pending
      // nomination org-wide — see RecognitionsController.GetMy.
      const data = await recognitionsApi.getMy({ page: 1, pageSize: 100 });
      setPending(data.filter((r) => r.status === "pending"));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApprove = async (id: number) => {
    await approve.mutateAsync(id);
    fetchPending();
  };

  const handleReject = async (id: number) => {
    await reject.mutateAsync(id);
    fetchPending();
  };

  if (isLoading) {
    return <div className="h-32 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />;
  }

  if (pending.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-base font-bold text-slate-950 dark:text-white">Pending Nominations</h3>
        <Badge variant="secondary">{pending.length} awaiting review</Badge>
      </div>

      <div className="flex flex-col gap-3">
        {pending.map((r) => (
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
              {/* Full nomination message — admins need this in full, not
                  truncated, to make an informed approve/reject decision. */}
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

export default function MyRecognitionPanel({ initialSubTab }: Props) {
  const { user } = useAuth();
  const [tab, setTab] = useState<"received" | "given">(initialSubTab ?? "received");
  const [received, setReceived] = useState<ApiRecognition[]>([]);
  const [given, setGiven] = useState<ApiRecognition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    Promise.all([
      recognitionsApi.getMy({ direction: "received", pageSize: 500 }),
      recognitionsApi.getMy({ direction: "sent", pageSize: 500 }),
    ])
      .then(([r, g]) => {
        if (cancelled) return;
        setReceived(r);
        setGiven(g);
      })
      .catch(console.error)
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = tab === "received" ? received : given;
  const filteredRows = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const person = tab === "received" ? r.fromEmployee?.name : r.toEmployee?.name;
    return (
      person?.toLowerCase().includes(q) ||
      r.category?.name?.toLowerCase().includes(q) ||
      r.message?.toLowerCase().includes(q)
    );
  });

  const download = async (id: number, kind: "card" | "certificate") => {
    const elId = kind === "certificate" ? `certificate-${id}` : `card-${id}`;
    const el = document.getElementById(elId);
    if (!el) return;
    await new Promise((r) => setTimeout(r, 100));
    // PERFORMANCE: html2canvas is a large canvas-rendering library needed
    // only at the moment someone actually clicks download, so it's loaded
    // on demand here rather than statically — a static import would pull
    // its ~200KB into the Profile page's initial bundle for every visitor.
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
    const link = document.createElement("a");
    link.download = kind === "certificate" ? "AwardCertificate.png" : "AppreciationCard.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-bold text-slate-950 dark:text-white">Recognition</h2>

      {user?.userRole === "admin" && <PendingNominationsReview />}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-6 border-b border-slate-100 px-5 pt-4 dark:border-slate-800">
          {(["received", "given"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "-mb-px border-b-2 pb-3 text-sm font-semibold uppercase tracking-wide transition",
                tab === t
                  ? "border-blue-600 text-blue-600 dark:text-sky-400"
                  : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex justify-end px-5 py-3">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recognitions"
              className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
                <th className="px-4 py-3">Badge</th>
                <th className="px-4 py-3">{tab === "received" ? "Recognized By" : "Recognized"}</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Reward Points</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Reward Citation</th>
                <th className="px-4 py-3">Team Name</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No {tab} recognitions found
                  </td>
                </tr>
              ) : (
                filteredRows.map((r) => {
                  const person = tab === "received" ? r.fromEmployee?.name : r.toEmployee?.name;
                  const typeLabel = r.category?.name ?? (r.type === "nomination" ? "Nomination" : "Appreciation");
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      <td className="px-4 py-3 text-xl">{r.category?.icon ?? "🏅"}</td>
                      <td className="px-4 py-3 font-medium text-slate-950 dark:text-white">{person ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{typeLabel}</td>
                      <td className="px-4 py-3 font-semibold text-blue-600 dark:text-sky-400">{r.points}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {new Date(r.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-3 text-slate-600 dark:text-slate-300" title={r.message}>
                        {r.message}
                      </td>
                      <td className="px-4 py-3 text-slate-400">-</td>
                      <td className="px-4 py-3">
                        {tab === "received" && (
                          <>
                            <div style={{ position: "fixed", left: "-9999px", top: 0, zIndex: -1 }}>
                              {r.type === "nomination" ? (
                                <AwardCertificate recognition={r} />
                              ) : (
                                <AppreciationCard recognition={r} />
                              )}
                            </div>
                            <button
                              onClick={() => download(r.id, r.type === "nomination" ? "certificate" : "card")}
                              aria-label="Download"
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition hover:bg-blue-100 dark:bg-blue-950/40 dark:text-sky-400"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

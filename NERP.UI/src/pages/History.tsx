import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { Star, TrendingUp, Heart, MoreVertical, Calendar, Clock, Download } from "lucide-react";
import { recognitionsApi, ApiRecognition } from "@/services/api";
import { useEffect, useState } from "react";
import AppreciationCard from "@/components/AppreciationCard";
import AwardCertificate from "@/components/AwardCertificate";
import html2canvas from "html2canvas";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";


function timeAgo(dateStr?: string) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

const getTenureMonths = (joiningDateStr?: string) => {
  if (!joiningDateStr) return 0;
  const joinDate = new Date(joiningDateStr);
  const diffTime = Date.now() - joinDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return Number((diffDays / 30.4375).toFixed(1));
};

export default function History() {
  const { user } = useAuth();
  const [receivedRecognitions, setReceivedRecognitions] = useState<ApiRecognition[]>([]);
  const [sentRecognitions, setSentRecognitions] = useState<ApiRecognition[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<ApiRecognition[]>([]);
  const [decisionComments, setDecisionComments] = useState<Record<number, string>>({});
  const [totalReceivedCount, setTotalReceivedCount] = useState(0);
  const [totalSentCount, setTotalSentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllReceived, setShowAllReceived] = useState(false);

  const [receivedPage, setReceivedPage] = useState(1);
  const [sentPage, setSentPage] = useState(1);

  const filterTypes = ["all", "appreciation", "nomination"] as const;
  const [receivedFilter, setReceivedFilter] = useState<(typeof filterTypes)[number]>("all");
  const [sentFilter, setSentFilter] = useState<(typeof filterTypes)[number]>("all");

  const fetchReceived = async (page: number, type: string) => {
    try {
      const data = await recognitionsApi.getMy({
        direction: "received",
        page,
        pageSize: 5,
        type: type === "all" ? undefined : type,
      });
      setReceivedRecognitions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSent = async (page: number, type: string) => {
    try {
      const isManagerOrAdmin = user?.userRole === "admin" || user?.userRole === "bu_manager" || user?.userRole === "cu_manager";
      const currentFilter = isManagerOrAdmin ? type : "appreciation";
      const data = await recognitionsApi.getMy({

        direction: "sent",
        page,
        pageSize: 5,
        type: currentFilter === "all" ? undefined : currentFilter,
      });
      setSentRecognitions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const allReceived = await recognitionsApi.getMy({ direction: "received", pageSize: 10000 });
      setTotalReceivedCount(allReceived.length);
      const allSent = await recognitionsApi.getMy({ direction: "sent", pageSize: 10000 });
      setTotalSentCount(allSent.length);

      const isApprover = user?.userRole === "bu_manager" || user?.userRole === "admin";
      if (isApprover) {
        const pending = await recognitionsApi.getPendingApprovals();
        setPendingApprovals(pending);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchReceived(receivedPage, receivedFilter),
      fetchSent(sentPage, sentFilter),
      fetchStats(),
    ]);
    setIsLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchReceived(receivedPage, receivedFilter);
    }
  }, [receivedPage, receivedFilter]);

  useEffect(() => {
    if (user) {
      fetchSent(sentPage, sentFilter);
    }
  }, [sentPage, sentFilter]);

  const handleReceivedFilterChange = (type: (typeof filterTypes)[number]) => {
    setReceivedFilter(type);
    setReceivedPage(1);
  };

  const handleSentFilterChange = (type: (typeof filterTypes)[number]) => {
    setSentFilter(type);
    setSentPage(1);
  };

  const handleBuDecision = async (id: number, decision: "approve" | "reject" | "shortlist") => {
    try {
      const comments = decisionComments[id] || "";
      await recognitionsApi.buDecision(id, decision, comments);
      setDecisionComments(prev => {
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
      await fetchStats();
      await fetchReceived(receivedPage, receivedFilter);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Action failed";
      toast.error(message);
      console.error(err);
    }
  };

  const handleHrDecision = async (id: number, decision: "select" | "reject") => {
    try {
      const comments = decisionComments[id] || "";
      await recognitionsApi.hrDecision(id, decision, comments);
      setDecisionComments(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (decision === "select") {
        toast.success("Award winner selected! 🏆");
      } else {
        toast.success("Nomination rejected ❌");
      }
      await fetchStats();
      await fetchReceived(receivedPage, receivedFilter);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Action failed";
      toast.error(message);
      console.error(err);
    }
  };


  const downloadCard = async (id: number) => {
    const card = document.getElementById(`card-${id}`);
    if (!card) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
    const canvas = await html2canvas(card, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
    const link = document.createElement("a");
    link.download = "AppreciationCard.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const downloadCertificate = async (id: number) => {
    const certificate = document.getElementById(`certificate-${id}`);
    if (!certificate) return;
    const canvas = await html2canvas(certificate, { scale: 2, backgroundColor: "#ffffff" });
    const link = document.createElement("a");
    link.download = "AwardCertificate.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const received = receivedRecognitions;
  const sent = sentRecognitions;
  const totalPoints = user?.totalPoints ?? 0;
  const totalRecognitions = totalReceivedCount + totalSentCount;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">Loading...</div>
    );
  }

  return (
    <div className="container-page flex flex-col">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2 text-slate-950 dark:text-white">
            History 🏅
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Your recognition history and points</p>
        </div>
      </div>

      {/* STATS */}
      <div className="grid md:grid-cols-3 gap-3 mb-3">
        <Card className="rounded-xl border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 dark:border-amber-900/40 dark:from-amber-950/30 dark:to-yellow-950/20">
          <CardContent className="flex items-center gap-4 p-5 min-h-[110px]">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-white shrink-0">
              <Star className="h-4 w-4" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{totalPoints.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Points</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:border-green-900/40 dark:from-green-950/30 dark:to-emerald-950/20">
          <CardContent className="flex items-center gap-4 p-5 min-h-[110px]">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-white shrink-0">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{received.length}</p>
              <p className="text-xs text-muted-foreground">Received</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50 dark:border-rose-900/40 dark:from-rose-950/30 dark:to-pink-950/20">
          <CardContent className="flex items-center gap-4 p-5 min-h-[110px]">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-white shrink-0">
              <Heart className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-bold leading-tight">{sent.length}</p>
              <p className="text-xs text-muted-foreground">Sent</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 flex-1 min-h-0">
        <div className="xl:col-span-2 space-y-4 min-h-0">
          
          {/* RECOGNITIONS RECEIVED */}
          <Card className="rounded-2xl border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <span>🏅</span>
                  <CardTitle className="text-lg">Recognitions Received</CardTitle>
                </div>
              </CardHeader>

              <div className="flex gap-2 px-6 pb-2">
                {filterTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => handleReceivedFilterChange(type)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${receivedFilter === type ? "bg-primary text-white" : "bg-muted hover:bg-muted/70"
                      }`}
                  >
                    {type === "all" ? "All" : type === "appreciation" ? "Appreciations" : "Nominations"}
                  </button>
                ))}
              </div>

              <CardContent className="space-y-1 pt-2">
                {received.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">No data available</p>
                ) : (
                  received.map((r) => (
                    <div key={r.id} className="flex items-start gap-3 rounded-xl px-2 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <UserAvatar name={r.fromEmployee?.name} avatar={r.fromEmployee?.avatar} size="h-9 w-9" fallbackClassName="text-xs" />

                      <div className="min-w-0 flex-1">
                        <p className="text-sm">
                          <span className="font-semibold text-blue-600">{r.fromEmployee?.name}</span>{" "}
                          {r.type === "appreciation" ? "appreciated" : "nominated"}{" "}
                          <span className="font-semibold text-blue-600">{r.toEmployee?.name}</span>
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5 truncate">{r.message}</p>

                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {r.category ? (
                            <Badge variant="secondary" className="text-xs">
                              {r.category.icon} {r.category.name}
                            </Badge>
                          ) : r.customCategory ? (
                            <Badge variant="secondary" className="text-xs">
                              ✨ {r.customCategory}
                            </Badge>
                          ) : null}
                          {r.type === "nomination" && (
                            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">+{r.points} pts</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end justify-between self-stretch shrink-0 gap-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {timeAgo(r.createdAt)}
                          <MoreVertical className="h-4 w-4" />
                        </div>
                        <div className="flex-1 flex items-center justify-center">
                          {r.type === "nomination" && (
                            <>
                              <div style={{ position: "fixed", left: "-9999px", top: "0", zIndex: -1 }}>
                                <AwardCertificate recognition={r} />
                              </div>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => downloadCertificate(r.id)}
                                    aria-label="Download Certificate"
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-sm hover:bg-primary/90 hover:shadow-md transition-all"
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>Download Certificate</TooltipContent>
                              </Tooltip>
                            </>
                          )}
                          {r.type === "appreciation" && (
                            <>
                              <div style={{ position: "fixed", left: "-9999px", top: "0", zIndex: -1 }}>
                                <AppreciationCard recognition={r} />
                              </div>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => downloadCard(r.id)}
                                    aria-label="Download Card"
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-sm hover:bg-primary/90 hover:shadow-md transition-all"
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>Download Card</TooltipContent>
                              </Tooltip>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div className="flex items-center justify-between pt-4 border-t">
                  <button
                    disabled={receivedPage === 1}
                    onClick={() => setReceivedPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none dark:border-slate-800 dark:bg-slate-900"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-muted-foreground flex items-center">
                    Page {receivedPage}
                  </span>
                  <button
                    disabled={receivedRecognitions.length < 5}
                    onClick={() => setReceivedPage(p => p + 1)}
                    className="px-3 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none dark:border-slate-800 dark:bg-slate-900"
                  >
                    Next
                  </button>
                </div>
              </CardContent>
            </Card>

          {/* RECOGNITIONS SENT */}
          <Card className="rounded-2xl border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-500" />
                <CardTitle className="text-lg">Recognitions Sent</CardTitle>
              </div>
            </CardHeader>

            <div className="flex gap-2 px-6 pb-2">
              {user?.userRole === "admin" || user?.userRole === "bu_manager" || user?.userRole === "cu_manager" ? (
                filterTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => handleSentFilterChange(type)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                      sentFilter === type ? "bg-primary text-white" : "bg-muted hover:bg-muted/70"
                    }`}
                  >
                    {type === "all" ? "All" : type === "appreciation" ? "Appreciations" : "Nominations"}
                  </button>
                ))
              ) : (
                <button
                  className="px-3 py-1 rounded-full text-xs font-medium bg-primary text-white"
                >
                  Appreciations
                </button>
              )}
            </div>

            <CardContent className="space-y-1 pt-2">
              {sent.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">No recognitions sent yet</p>
              ) : (
                sent.map((r) => {
                  const awardName = r.category?.name ?? r.customCategory ?? "Spot Award";
                  return (
                    <div key={r.id} className="flex items-start gap-3 rounded-xl px-2 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <UserAvatar name={r.toEmployee?.name} avatar={r.toEmployee?.avatar} size="h-9 w-9" fallbackClassName="text-xs" />

                      <div className="min-w-0 flex-1">
                        <p className="text-sm">
                          You recognized <span className="font-semibold">{r.toEmployee?.name}</span>
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5 truncate">{r.message}</p>

                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {r.category ? (
                            <Badge variant="secondary" className="text-xs border-primary/20">
                              {r.category.icon} {r.category.name}
                            </Badge>
                          ) : r.customCategory ? (
                            <Badge variant="secondary" className="text-xs border-primary/20">
                              ✨ {r.customCategory}
                            </Badge>
                          ) : null}
                          {r.type === "nomination" && (
                            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">+{r.points} pts</span>
                          )}
                          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0.5", 
                            r.status === "Approved" || r.status === "Approved Winner" || r.status === "approved"
                              ? "border-green-200 text-green-700 bg-green-50 dark:bg-green-950/30"
                              : r.status === "Rejected"
                              ? "border-red-200 text-red-700 bg-red-50 dark:bg-red-950/30"
                              : "border-amber-200 text-amber-700 bg-amber-50 dark:bg-amber-950/30"
                          )}>
                            Status: {r.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                        {timeAgo(r.createdAt)}
                        <MoreVertical className="h-4 w-4" />
                      </div>
                    </div>
                  );
                })
              )}
              <div className="flex items-center justify-between pt-4 border-t">
                <button
                  disabled={sentPage === 1}
                  onClick={() => setSentPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none dark:border-slate-800 dark:bg-slate-900"
                >
                  Previous
                </button>
                <span className="text-xs text-muted-foreground flex items-center">
                  Page {sentPage}
                </span>
                <button
                  disabled={sentRecognitions.length < 5}
                  onClick={() => setSentPage(p => p + 1)}
                  className="px-3 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none dark:border-slate-800 dark:bg-slate-900"
                >
                  Next
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SIDEBAR */}
        <div className="xl:col-span-1 space-y-6">
          <Card className="overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                <Star className="h-7 w-7" />
              </div>
              <p className="mt-4 text-lg font-semibold">Keep going, {user?.name?.split(" ")[0] ?? "there"}!</p>
              <p className="mt-1 text-sm text-white/80">Your recognitions make a big difference.</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Your Stats Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/90 text-white">
                  <Star className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold leading-tight">{totalPoints.toLocaleString()} pts</p>
                  <p className="text-xs text-muted-foreground">Total Points</p>
                </div>
              </div>
              {user?.userRole === "admin" || user?.userRole === "bu_manager" ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/90 text-white">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold leading-tight">{pendingApprovals.length}</p>
                    <p className="text-xs text-muted-foreground">Pending Approvals</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/90 text-white">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold leading-tight">{received.length}</p>
                    <p className="text-xs text-muted-foreground">Received</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-400/90 text-white">
                  <Heart className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold leading-tight">{sent.length}</p>
                  <p className="text-xs text-muted-foreground">Sent</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/90 text-white">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold leading-tight">{totalRecognitions}</p>
                  <p className="text-xs text-muted-foreground">Total Recognitions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { Star, TrendingUp, Heart, MoreVertical, Calendar } from "lucide-react";
import { recognitionsApi, ApiRecognition } from "@/services/api";
import { useEffect, useState } from "react";
import AppreciationCard from "@/components/AppreciationCard";
import AwardCertificate from "@/components/AwardCertificate";
import html2canvas from "html2canvas";
import { Download } from "lucide-react";

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

export default function MyRecognitions() {
  const { user } = useAuth();
  const [recognitions, setRecognitions] = useState<ApiRecognition[]>([]);
  const [sentRecognitions, setSentRecognitions] = useState<ApiRecognition[]>([]);
  const [allRecognitions, setAllRecognitions] = useState<ApiRecognition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const myRecognitions = await recognitionsApi.getMy();
      setRecognitions(myRecognitions);

      const all = await recognitionsApi.getAll();
      setAllRecognitions(all);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const [showAllSent, setShowAllSent] = useState(false);
  const [showAllReceived, setShowAllReceived] = useState(false);
  const filterTypes = ["all", "appreciation", "nomination"] as const;
  const [receivedFilter, setReceivedFilter] = useState<(typeof filterTypes)[number]>("all");
  const [sentFilter, setSentFilter] = useState<(typeof filterTypes)[number]>("all");

  const pendingNominations = recognitions.filter(
    (r) => r.type === "nomination" && r.status === "pending"
  );

  const received = recognitions.filter((r) => r.toEmployeeId === user?.id);

  const sent = allRecognitions.filter((r) => r.fromEmployee?.id === user?.id);

  const filteredReceived =
    receivedFilter === "all" ? received : received.filter((r) => r.type === receivedFilter);

  const filteredSent = sentFilter === "all" ? sent : sent.filter((r) => r.type === sentFilter);

  const handleApprove = async (id: number) => {
    try {
      await recognitionsApi.approve(id);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await recognitionsApi.reject(id);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const downloadCard = async (id: number) => {
    const card = document.getElementById(`card-${id}`);
    if (!card) {
      console.log("Card not found");
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

  const totalPoints = user?.totalPoints ?? 0;
  const totalRecognitions = received.length + sent.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">Loading...</div>
    );
  }

  return (
    <div className="container-page flex h-full min-h-0 flex-col overflow-y-auto p-4 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2 text-slate-950 dark:text-white">
            My Recognitions 🏅
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Your recognition history and points</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
          <Calendar className="h-3.5 w-3.5" />
          This Month
        </button>
      </div>

      {/* STATS */}
      <div className="grid md:grid-cols-3 gap-3 mb-3">
        <Card className="rounded-xl border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 dark:border-amber-900/40 dark:from-amber-950/30 dark:to-yellow-950/20">
          <CardContent className="flex items-center gap-3 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/90 text-white shrink-0">
              <Star className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-bold leading-tight">{totalPoints.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Points</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:border-green-900/40 dark:from-green-950/30 dark:to-emerald-950/20">
          <CardContent className="flex items-center gap-3 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/90 text-white shrink-0">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-bold leading-tight">{received.length}</p>
              <p className="text-xs text-muted-foreground">Received</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50 dark:border-rose-900/40 dark:from-rose-950/30 dark:to-pink-950/20">
          <CardContent className="flex items-center gap-3 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-400/90 text-white shrink-0">
              <Heart className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-bold leading-tight">{sent.length}</p>
              <p className="text-xs text-muted-foreground">Sent</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MAIN GRID: content + sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 flex-1 min-h-0">
        <div className="xl:col-span-2 space-y-4 min-h-0">
          {/* ADMIN / PENDING NOMINATIONS */}
          {user?.userRole === "admin" && (
            <Card className="rounded-2xl border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Pending Nominations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(showAllReceived ? pendingNominations : pendingNominations.slice(0, 5)).map((r) => (
                  <div key={r.id} className="flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="text-xs font-semibold">
                        {r.fromEmployee?.avatar || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">
                        <span className="font-semibold text-blue-600">{r.fromEmployee?.name}</span>{" "}
                        nominated{" "}
                        <span className="font-semibold text-blue-600">{r.toEmployee?.name}</span>
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{r.message}</p>
                    </div>
                    <div className="ml-auto flex gap-2 shrink-0">
                      <button
                        onClick={() => handleApprove(r.id)}
                        className="px-3 h-8 text-xs font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(r.id)}
                        className="px-3 h-8 text-xs font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* RECOGNITIONS RECEIVED */}
          {user?.userRole !== "admin" && (
            <Card className="rounded-2xl border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <span>🏅</span>
                  <CardTitle className="text-lg">Recognitions Received</CardTitle>
                </div>
                <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">View all</button>
              </CardHeader>

              <div className="flex gap-2 px-6 pb-2">
                {filterTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setReceivedFilter(type)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                      receivedFilter === type ? "bg-primary text-white" : "bg-muted hover:bg-muted/70"
                    }`}
                  >
                    {type === "all" ? "All" : type === "appreciation" ? "Appreciations" : "Nominations"}
                  </button>
                ))}
              </div>

              <CardContent className="space-y-1 pt-2">
                {filteredReceived.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">No data available</p>
                ) : (
                  (showAllReceived ? filteredReceived : filteredReceived.slice(0, 5)).map((r) => (
                    <div key={r.id} className="flex items-start gap-3 rounded-xl px-2 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="text-xs font-semibold">
                          {r.fromEmployee?.avatar || "?"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm">
                          <span className="font-semibold text-blue-600">{r.fromEmployee?.name}</span>{" "}
                          {r.type === "appreciation" ? "appreciated" : "nominated"}{" "}
                          <span className="font-semibold text-blue-600">{r.toEmployee?.name}</span>
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5 truncate">{r.message}</p>

                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {r.category && (
                            <Badge variant="secondary" className="text-xs">
                              {r.category.icon} {r.category.name}
                            </Badge>
                          )}
                          {r.type === "nomination" && (
                            <span className="text-xs font-medium text-gold">+{r.points} pts</span>
                          )}
                        </div>

                        {r.type === "nomination" && (
                          <>
                            <div style={{ position: "fixed", left: "-9999px", top: "0", zIndex: -1 }}>
                              <AwardCertificate recognition={r} />
                            </div>
                            <button
                              onClick={() => downloadCertificate(r.id)}
                              className="mt-2 flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg bg-primary text-white hover:bg-primary/90"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Download Certificate
                            </button>
                          </>
                        )}
                        {r.type === "appreciation" && (
                          <>
                            <div style={{ position: "fixed", left: "-9999px", top: "0", zIndex: -1 }}>
                              <AppreciationCard recognition={r} />
                            </div>
                            <button
                              onClick={() => downloadCard(r.id)}
                              className="mt-2 flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg bg-primary text-white hover:bg-primary/90"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Download Card
                            </button>
                          </>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                        {timeAgo(r.createdAt as any)}
                        <MoreVertical className="h-4 w-4" />
                      </div>
                    </div>
                  ))
                )}
                {filteredReceived.length > 5 && (
                  <div className="pt-2">
                    <button
                      onClick={() => setShowAllReceived(!showAllReceived)}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                      {showAllReceived ? "Show Less" : `View All Received (${received.length})`}
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* RECOGNITIONS SENT */}
          <Card className="rounded-2xl border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-500" />
                <CardTitle className="text-lg">Recognitions Sent</CardTitle>
              </div>
              <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">View all</button>
            </CardHeader>

            <div className="flex gap-2 px-6 pb-2">
              {filterTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSentFilter(type)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    sentFilter === type ? "bg-primary text-white" : "bg-muted hover:bg-muted/70"
                  }`}
                >
                  {type === "all" ? "All" : type === "appreciation" ? "Appreciations" : "Nominations"}
                </button>
              ))}
            </div>

            <CardContent className="space-y-1 pt-2">
              {filteredSent.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">No recognitions sent yet</p>
              ) : (
                (showAllSent ? filteredSent : filteredSent.slice(0, 5)).map((r) => (
                  <div key={r.id} className="flex items-start gap-3 rounded-xl px-2 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="text-xs font-semibold">
                        {r.toEmployee?.avatar || "?"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        You recognized <span className="font-semibold">{r.toEmployee?.name}</span>
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">{r.message}</p>

                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {r.category && (
                          <Badge variant="secondary" className="text-xs border-primary/20">
                            {r.category.icon} {r.category.name}
                          </Badge>
                        )}
                        {r.type === "nomination" && (
                          <span className="text-xs font-medium text-gold">+{r.points} pts</span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                      {timeAgo(r.createdAt as any)}
                      <MoreVertical className="h-4 w-4" />
                    </div>
                  </div>
                ))
              )}
              {filteredSent.length > 5 && (
                <div className="pt-2 text-center">
                  <button
                    onClick={() => setShowAllSent(!showAllSent)}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    {showAllSent ? "Show Less" : `View all sent recognitions →`}
                  </button>
                </div>
              )}
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
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/90 text-white">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold leading-tight">{received.length}</p>
                  <p className="text-xs text-muted-foreground">Received</p>
                </div>
              </div>
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
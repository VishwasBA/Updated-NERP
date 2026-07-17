import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, CheckCircle, ChevronsUpDown, X, Star, ArrowRight, Award } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useEmployees,
  useAwardCategories,
  useCreateRecognition,
  useRecentRecognitions,
} from "@/hooks/useApiData";
import { ApiRecognition } from "@/services/api";
import { toast } from "sonner";
import { UserAvatar } from "@/components/ui/avatar";
import { RecognitionPreviewCard } from "@/components/ui/RecognitionPreviewCard";
import NominationWizard from "@/components/nomination/NominationWizard";
/* ─────────────────────────────────────────
   CATEGORY CONFIG  — exact screenshot colors
───────────────────────────────────────── */
const CAT_CFG: Record<
  string,
  { icon: JSX.Element; color: string; bg: string; border: string; badge: string; text: string }
> = {
  Teamwork: {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <circle cx="8.5" cy="6.5" r="2.8" stroke="#5B6AD4" strokeWidth="1.8" />
        <path d="M2.5 19.5c0-3.1 2.7-5.5 6-5.5s6 2.4 6 5.5" stroke="#5B6AD4" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="17.5" cy="7.5" r="2.2" stroke="#5B6AD4" strokeWidth="1.7" />
        <path d="M15.5 19.5c0-2.3 1.5-4.2 3.5-5" stroke="#5B6AD4" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
    color: "#5B6AD4", bg: "#EEF0FB", border: "#5B6AD4",
    badge: "bg-[#EEF0FB] text-[#5B6AD4]", text: "text-[#5B6AD4]",
  },
  Innovation: {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M12 3.5a5.5 5.5 0 0 1 3.5 9.7c-.4.3-.5.7-.5 1.1V15H9v-.7c0-.4-.2-.8-.5-1.1A5.5 5.5 0 0 1 12 3.5z" stroke="#F5A623" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9.5 17.5h5" stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M10.5 20h3" stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    color: "#F5A623", bg: "#FEF6E7", border: "#F5A623",
    badge: "bg-[#FEF6E7] text-[#F5A623]", text: "text-[#F5A623]",
  },
  Leadership: {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M3.5 17h17l-1.8-8.5-4.2 3.8L12 5.5l-2.5 6.8-4.2-3.8L3.5 17z" stroke="#9B51E0" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
        <path d="M3.5 17h17" stroke="#9B51E0" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M6 20h12" stroke="#9B51E0" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    color: "#9B51E0", bg: "#F5EDFD", border: "#9B51E0",
    badge: "bg-[#F5EDFD] text-[#9B51E0]", text: "text-[#9B51E0]",
  },
  Excellence: {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M12 2.5l2.5 5.1 5.7.8-4.1 4 1 5.6L12 15.3l-5.1 2.7 1-5.6-4.1-4 5.7-.8L12 2.5z" stroke="#1DB954" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    ),
    color: "#1DB954", bg: "#E8F8EE", border: "#1DB954",
    badge: "bg-[#E8F8EE] text-[#1DB954]", text: "text-[#1DB954]",
  },
  Supportive: {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M12 20.5S3 14 3 8.5a4.5 4.5 0 0 1 9-.5 4.5 4.5 0 0 1 9 .5C21 14 12 20.5 12 20.5z" stroke="#E91E8C" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
    color: "#E91E8C", bg: "#FDE9F4", border: "#E91E8C",
    badge: "bg-[#FDE9F4] text-[#E91E8C]", text: "text-[#E91E8C]",
  },
  Ownership: {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M12 2c-1 1.5-4 5-4 9.5h8C16 7 13 3.5 12 2z" stroke="#2D9CDB" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M8 11.5l-1.5 4h11l-1.5-4" stroke="#2D9CDB" strokeWidth="1.8" strokeLinejoin="round" />
        <circle cx="12" cy="9" r="1.4" stroke="#2D9CDB" strokeWidth="1.5" />
        <path d="M9.5 15.5l-1 3.5" stroke="#2D9CDB" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M14.5 15.5l1 3.5" stroke="#2D9CDB" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
    color: "#2D9CDB", bg: "#E8F4FD", border: "#2D9CDB",
    badge: "bg-[#E8F4FD] text-[#2D9CDB]", text: "text-[#2D9CDB]",
  },
};

/* ─────────────────────────────────────────
   QUICK TEMPLATES
───────────────────────────────────────── */
const QUICK_TEMPLATES = [
  { label: "Great teamwork!", emoji: "👥", text: "Great teamwork! Your collaboration made a real difference to the whole team." },
  { label: "Amazing effort!", emoji: "🚀", text: "Amazing effort! You went above and beyond and it really shows." },
  { label: "Outstanding work!", emoji: "⭐", text: "Outstanding work! The quality of your output speaks for itself." },
  { label: "Thank you!", emoji: "❤️", text: "Thank you! Your support and dedication meant a lot to everyone around you." },
];

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */

/** API returns category as an object {id,name,...} — safely extract name */
function safeCatName(category: unknown): string {
  if (!category) return "";
  if (typeof category === "string") return category;
  if (typeof category === "object" && category !== null && "name" in category) {
    return String((category as { name: unknown }).name);
  }
  return "";
}

/** Relative time label */
function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ─────────────────────────────────────────
   COMPONENT
───────────────────────────────────────── */
export default function SendAppreciation() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: employees = [] } = useEmployees();
  const { data: categories = [] } = useAwardCategories();
  const { data: recentRecognitions = [] } = useRecentRecognitions(4);
  const createMutation = useCreateRecognition();

  // Deep-linked from the Manager Dashboard's "Recognize" action on an
  // under-recognized team member — pre-selects them in the wizard.
  const prefillEmployeeId = (location.state as { employeeId?: number } | null)?.employeeId ?? null;

  const availableCategories = categories.filter((c) => !c.managerOnly);

  const handleSend = async ({
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
        type: "appreciation",
      });
      toast.success("Appreciation sent! 🎉");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send appreciation";
      toast.error(msg);
      throw err;
    }
  };

  /* ── Main page ── */
  return (
    <div className="container-page space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            Send Appreciation
            <span className="text-lg">👏</span>
          </h1>
          <p className="text-muted-foreground mt-1">Recognize a colleague's great work and make their day!</p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Card 1: Send Appreciation */}
        <Card className="rounded-2xl border-2 border-pink-600/30 bg-pink-50/10 dark:border-pink-500/20 dark:bg-pink-950/10 p-5 shadow-sm flex flex-col justify-between h-full group">
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
                disabled
                className="w-full sm:w-auto bg-pink-600 text-white font-semibold gap-1.5 rounded-xl opacity-90 cursor-default"
              >
                Current Flow: Send Appreciation
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


      <NominationWizard
        heading="Send Appreciation"
        categories={availableCategories}
        employees={employees}
        currentUserId={user?.id}
        isSubmitting={createMutation.isPending}
        submitLabel="Send Appreciation"
        successTitle="Appreciation Sent!"
        successMessage="Your colleague will be notified of your recognition and it'll appear on the Wall of Fame."
        footerNote="Appreciation is a free-form kudos — it doesn't carry points, but it's visible to the whole team and shown on the Wall of Fame."
        onSubmit={handleSend}
        initialEmployeeId={prefillEmployeeId}
        pointsEnabled={false}
      />

      {/* ── Recent Appreciations ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold flex items-center gap-2 text-base">
            <span>👥</span> Recent Appreciations
          </h2>
        </div>

        {recentRecognitions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No recent appreciations yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {recentRecognitions.map((item, i) => {
              // Safely resolve category name from API object or string
              const catName = safeCatName(item.category) || safeCatName(item.categoryId);
              const cfg = catName ? CAT_CFG[catName] : null;

              const fromEmp = employees.find((e) => e.id === item.fromEmployee?.id);
              const fromName = fromEmp?.name ?? item.fromEmployee?.name ?? "";
              const fromDept = fromEmp?.department ?? "";
              const fromAvatar = fromEmp?.avatar ?? item.fromEmployee?.avatar;

              const toEmp = employees.find((e) => e.id === item.toEmployee?.id);
              const toName = toEmp?.name ?? item.toEmployee?.name ?? "";
              const toDept = toEmp?.department ?? "";
              const toAvatar = toEmp?.avatar ?? item.toEmployee?.avatar;

              const msgText = typeof item.message === "string" ? item.message : "";
              const timeLabel = timeAgo(item.createdAt ?? "");

              return (
                <Card key={item.id ?? i} className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">

                      {/* From */}
                      <div className="flex flex-col items-center gap-0.5 min-w-[52px]">
                        <UserAvatar name={fromName} avatar={fromAvatar} size="h-8 w-8" fallbackClassName="text-[10px]" />
                        <span className="text-[10px] text-muted-foreground text-center leading-tight">{fromName}</span>
                        <span className="text-[10px] text-muted-foreground text-center leading-tight">{fromDept}</span>
                      </div>

                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />

                      {/* To */}
                      <div className="flex flex-col items-center gap-0.5 min-w-[52px]">
                        <UserAvatar name={toName} avatar={toAvatar} size="h-8 w-8" fallbackClassName="text-[10px]" />
                        <span className="text-[10px] text-muted-foreground text-center leading-tight">{toName}</span>
                        <span className="text-[10px] text-muted-foreground text-center leading-tight">{toDept}</span>
                      </div>

                      {/* Category badge — only if we have a valid string name */}
                      {catName && cfg && (
                        <div
                          style={{ background: cfg.bg, color: cfg.color }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium flex-shrink-0"
                        >
                          <span className="inline-flex" style={{ width: 14, height: 14, transform: "scale(0.55)", transformOrigin: "center" }}>
                            {cfg.icon}
                          </span>
                          {catName}
                        </div>
                      )}

                      {/* Message snippet */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{msgText}</p>
                      </div>

                      {/* Time */}
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap self-start flex-shrink-0">
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

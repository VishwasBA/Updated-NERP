import { useState } from "react";
import { useLocation } from "react-router-dom";
import { User as UserIcon, Trophy, Grid3x3, ShoppingBag, Flag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import ProfileDetailsPanel from "@/components/profile/ProfileDetailsPanel";
import MyRecognitionPanel from "@/components/profile/MyRecognitionPanel";
import MyPointsPanel from "@/components/profile/MyPointsPanel";
import MyOrdersPanel from "@/components/profile/MyOrdersPanel";
import MyMilestonesPanel from "@/components/profile/MyMilestonesPanel";

type TabKey = "profile" | "recognition" | "points" | "milestones" | "orders";

const TABS: { key: TabKey; label: string; icon: typeof UserIcon }[] = [
  { key: "profile", label: "My Profile", icon: UserIcon },
  { key: "recognition", label: "My Recognition", icon: Trophy },
  { key: "points", label: "My Points", icon: Grid3x3 },
  { key: "milestones", label: "Milestones", icon: Flag },
  { key: "orders", label: "My Orders", icon: ShoppingBag },
];

export default function Profile() {
  const { user, loading } = useAuth();
  const location = useLocation();
  // Deep-linked from the top navbar's "Received" pill (opens straight to
  // My Recognition > Received) — falls back to the default profile tab.
  const navState = location.state as { tab?: TabKey; recognitionSubTab?: "received" | "given" } | null;
  const [tab, setTab] = useState<TabKey>(navState?.tab ?? "profile");

  if (loading) {
    return (
      <div className="container-page space-y-6">
        <div className="h-96 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="container-page flex flex-col gap-6 pb-8 lg:flex-row">
      {/* Mini profile sidebar */}
      <aside className="flex shrink-0 flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 lg:w-64 lg:self-start">
        <div className="mb-3 flex flex-col items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
          <UserAvatar name={user?.name} size="h-16 w-16" fallbackClassName="text-lg font-bold" />
          <p className="max-w-full truncate text-sm font-semibold text-slate-950 dark:text-white">{user?.name}</p>
        </div>

        <nav className="flex flex-col gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition",
                tab === t.key
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-sky-300"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
              )}
            >
              <t.icon className="h-4 w-4 shrink-0" />
              {t.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Active panel */}
      <div className="min-w-0 flex-1">
        {tab === "profile" && <ProfileDetailsPanel />}
        {tab === "recognition" && <MyRecognitionPanel initialSubTab={navState?.recognitionSubTab} />}
        {tab === "points" && <MyPointsPanel />}
        {tab === "milestones" && <MyMilestonesPanel />}
        {tab === "orders" && <MyOrdersPanel />}
      </div>
    </div>
  );
}

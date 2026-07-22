import { useState } from "react";
import { User as UserIcon, Trophy, Grid3x3, ShoppingBag, Flag, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import ProfileDetailsPanel from "@/components/profile/ProfileDetailsPanel";
import MyRecognitionPanel from "@/components/profile/MyRecognitionPanel";
import MyPointsPanel from "@/components/profile/MyPointsPanel";
import MyOrdersPanel from "@/components/profile/MyOrdersPanel";
import MyMilestonesPanel from "@/components/profile/MyMilestonesPanel";
import { useNavigate } from "react-router-dom";

type TabKey = "profile" | "recognition" | "points" | "milestones" | "orders";

const TABS: { key: TabKey; label: string; icon: typeof UserIcon }[] = [
  { key: "profile", label: "My Profile", icon: UserIcon },
  { key: "recognition", label: "My Recognition", icon: Trophy },
  { key: "points", label: "My Points", icon: Grid3x3 },
  { key: "milestones", label: "Milestones", icon: Flag },
  { key: "orders", label: "My Orders", icon: ShoppingBag },
];

export default function Profile() {
  const { user, loading, logout } = useAuth();
  const [tab, setTab] = useState<TabKey>("profile");
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="container-page space-y-6">
        <div className="h-96 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="container-page flex flex-col gap-8 pb-12 lg:flex-row">
      {/* Mini profile sidebar */}
      <aside className="flex shrink-0 flex-col gap-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 lg:w-72 lg:self-start">
        <div className="mb-4 flex flex-col items-center gap-3 border-b border-slate-100 pb-5 dark:border-slate-800/80">
          <UserAvatar name={user?.name} avatar={user?.avatar} size="h-20 w-20" fallbackClassName="text-2xl font-bold" />
          <div className="text-center min-w-0 w-full">
            <p className="truncate text-base font-bold text-slate-950 dark:text-white">{user?.name}</p>
            <p className="truncate text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5">{user?.role}</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "relative flex items-center gap-3 rounded-xl py-3 px-4 text-left text-sm font-semibold transition-all duration-200",
                tab === t.key
                  ? "bg-blue-50/70 text-blue-600 dark:bg-blue-950/30 dark:text-sky-400 shadow-sm border-l-4 border-blue-600 pl-3"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50/80 dark:hover:bg-slate-900/50 hover:text-slate-900 dark:hover:text-white hover:translate-x-1 border-l-4 border-transparent pl-3"
              )}
            >
              <t.icon className="h-4.5 w-4.5 shrink-0" />
              {t.label}
            </button>
          ))}
        </nav>

        <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/50"
          >
            <LogOut className="h-4.5 w-4.5 shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* Active panel */}
      <div className="min-w-0 flex-1">
        {tab === "profile" && <ProfileDetailsPanel />}
        {tab === "recognition" && <MyRecognitionPanel />}
        {tab === "points" && <MyPointsPanel />}
        {tab === "milestones" && <MyMilestonesPanel />}
        {tab === "orders" && <MyOrdersPanel />}
      </div>
    </div>
  );
}

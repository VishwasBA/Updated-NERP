import { Link, useNavigate } from "react-router-dom";
import { Trophy, Coins, Bell, ChevronDown, Menu, Cake, Sparkles, Award as AwardIcon, Gift, Megaphone, Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useReceivedRecognitionsCount,
} from "@/hooks/useApiData";
import { cn } from "@/lib/utils";

const notificationIcon: Record<string, typeof Bell> = {
  appreciation: Heart,
  reward: Gift,
  points: Coins,
  award: AwardIcon,
  announcement: Megaphone,
  birthday: Cake,
  anniversary: Sparkles,
};

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function TopNavbar({ onOpenMobileMenu }: { onOpenMobileMenu?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: notifications = [] } = useNotifications();
  const { data: receivedCount = 0 } = useReceivedRecognitionsCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 flex-shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-slate-800 dark:bg-slate-950/90 sm:px-6">
      <div className="flex items-center gap-3 lg:hidden">
        <Button variant="ghost" size="icon" onClick={onOpenMobileMenu} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Points received */}
        <Link
          to="/profile"
          state={{ tab: "recognition", recognitionSubTab: "received" }}
          className="flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          <Trophy className="h-4 w-4" />
          <span className="text-sm font-bold leading-none">{receivedCount}</span>
          <span className="hidden text-xs font-medium leading-none sm:inline">Received</span>
        </Link>

        {/* Points balance */}
        <Link
          to="/redeem"
          className="flex items-center gap-1.5 rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-violet-700 transition hover:bg-violet-100 dark:border-violet-900/40 dark:bg-violet-950/40 dark:text-violet-300"
        >
          <Coins className="h-4 w-4" />
          <span className="text-sm font-bold leading-none">{user?.totalPoints ?? 0}</span>
          <span className="hidden text-xs font-medium leading-none sm:inline">Balance</span>
        </Link>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 rounded-2xl p-2">
            <div className="flex items-center justify-between px-2 py-1.5">
              <DropdownMenuLabel className="p-0 text-sm font-semibold">Notifications</DropdownMenuLabel>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Mark all read
                </button>
              )}
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-slate-400">No notifications yet</p>
              ) : (
                notifications.slice(0, 6).map((n) => {
                  const Icon = notificationIcon[n.type] ?? Bell;
                  return (
                    <DropdownMenuItem
                      key={n.id}
                      onClick={() => !n.isRead && markRead.mutate(n.id)}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-xl p-2.5 focus:bg-slate-100 dark:focus:bg-slate-800",
                        !n.isRead && "bg-blue-50/70 dark:bg-blue-950/30"
                      )}
                    >
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-slate-800 dark:text-sky-400">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{n.title}</p>
                        <p className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{n.message}</p>
                        <p className="mt-0.5 text-[11px] text-slate-400">{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                    </DropdownMenuItem>
                  );
                })
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer justify-center rounded-xl text-sm font-semibold text-blue-600 focus:bg-blue-50 focus:text-blue-700 dark:focus:bg-blue-950/40">
              <Link to="/notifications">View all notifications</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Language (display-only; no i18n backend exists yet) */}
        <div className="hidden items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300 md:flex">
          English
        </div>

        {/* Profile menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition hover:bg-slate-100 dark:hover:bg-slate-800">
              <UserAvatar name={user?.name} size="h-8 w-8" fallbackClassName="text-xs font-bold" />
              <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
            <div className="px-2 py-1.5">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user?.name}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.userRole} · {user?.department}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer rounded-xl">
              <Link to="/profile">Profile & Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer rounded-xl">
              <Link to="/redeem-history">Redeem History</Link>
            </DropdownMenuItem>
            {user?.userRole === "admin" && (
              <DropdownMenuItem asChild className="cursor-pointer rounded-xl">
                <Link to="/admin">User Management</Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer rounded-xl text-rose-600 focus:bg-rose-50 focus:text-rose-700 dark:focus:bg-rose-950/40"
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

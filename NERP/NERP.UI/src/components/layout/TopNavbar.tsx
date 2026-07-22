import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  ChevronDown,
  Menu,
  Cake,
  Sparkles,
  Award as AwardIcon,
  Gift,
  Megaphone,
  Heart,
  Sun,
  Moon,
  PlusCircle,
} from "lucide-react";
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
} from "@/hooks/useApiData";
import { cn } from "@/lib/utils";

const notificationIcon: Record<string, typeof Bell> = {
  appreciation: Heart,
  reward: Gift,
  points: Sparkles,
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

interface TopNavbarProps {
  onOpenMobileMenu?: () => void;
  dark: boolean;
  onToggleDark: () => void;
}

export default function TopNavbar({ onOpenMobileMenu, dark, onToggleDark }: TopNavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const runSearch = () => {
    const q = searchValue.trim();
    if (!q) return;
    navigate("/directory", { state: { search: q } });
  };

  return (
    <header className="sticky top-0 z-30 grid h-[72px] flex-shrink-0 grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-border/70 bg-card/80 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-card/60 sm:px-6 lg:grid-cols-[1fr_auto_1fr] lg:rounded-t-[28px] lg:border-b-0 lg:border lg:border-border/60">
      {/* Left cell: mobile menu trigger; hidden on desktop but still occupies the column so the center cell stays truly centered */}
      <div className="flex items-center">
        <Button variant="ghost" size="icon" onClick={onOpenMobileMenu} aria-label="Open menu" className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Center cell: real search input — Enter searches the Directory directly, no popup */}
      <div className="flex justify-center px-2">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            placeholder="Search employees…"
            className="h-11 w-full rounded-full border border-border bg-muted/60 pl-10 pr-4 text-sm text-foreground transition placeholder:text-muted-foreground focus:border-primary/40 focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 sm:gap-2">
        {/* Quick action */}
        <Button
          asChild
          className="hidden items-center gap-1.5 rounded-full bg-primary px-4 font-semibold text-primary-foreground shadow-glow-primary transition hover:bg-primary/90 sm:inline-flex"
        >
          <Link to="/appreciate">
            <PlusCircle className="h-4 w-4" />
            Appreciate
          </Link>
        </Button>

        {/* Theme toggle */}
        <button
          onClick={onToggleDark}
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
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
                  className="text-xs font-semibold text-primary hover:text-primary/80"
                >
                  Mark all read
                </button>
              )}
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-muted-foreground">No notifications yet</p>
              ) : (
                notifications.slice(0, 6).map((n) => {
                  const Icon = notificationIcon[n.type] ?? Bell;
                  return (
                    <DropdownMenuItem
                      key={n.id}
                      onClick={() => !n.isRead && markRead.mutate(n.id)}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-xl p-2.5 focus:bg-muted",
                        !n.isRead && "bg-primary/5"
                      )}
                    >
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{n.title}</p>
                        <p className="line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground/70">{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    </DropdownMenuItem>
                  );
                })
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer justify-center rounded-xl text-sm font-semibold text-primary focus:bg-primary/10 focus:text-primary">
              <Link to="/notifications">View all notifications</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition hover:bg-muted">
              <UserAvatar name={user?.name} size="h-8 w-8" fallbackClassName="text-xs font-bold" />
              <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
            <div className="px-2 py-1.5">
              <p className="truncate text-sm font-semibold text-foreground">{user?.name}</p>
              <p className="truncate text-xs capitalize text-muted-foreground">
                {user?.userRole} · {user?.department}
              </p>
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
                <Link to="/admin">Admin Dashboard</Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer rounded-xl text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
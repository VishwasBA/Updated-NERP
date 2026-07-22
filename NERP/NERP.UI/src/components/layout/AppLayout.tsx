import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Award,
  Trophy,
  Gift,
  Star,
  X,
  Sun,
  Moon,
  LogOut,
  User,
  Users,
  Users2,
  Building2,
  Shield,
  Bell,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn, getLocationFlag } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import TopNavbar from "@/components/layout/TopNavbar";
import CommandPalette, { useCommandPaletteShortcut } from "@/components/layout/CommandPalette";

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Primary sidebar items — kept to the compact set shown in the reference
  // design. Everything else (Profile, Notifications, Redeem History,
  // Admin) remains fully reachable via the top navbar's profile menu, so
  // no existing route or permission becomes unreachable.
  const navItems = [
    { to: "/", label: "Dashboard", icon: Home },
    { to: "/directory", label: "Directory", icon: Users2 },
    { to: "/my-recognitions", label: "Wall of Fame", icon: Award },
    { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
    {
      to: user?.userRole !== "employee" ? "/nominations" : "/appreciate",
      label: "Appreciate",
      icon: Star,
    },
    { to: "/redeem", label: "Rewards", icon: Gift },
    // Admins don't have direct reports of their own, so "My Team" doesn't
    // apply — they get an org-wide view across every manager's team
    // instead. Managers keep the personal, direct-reports-only dashboard.
    ...(user?.userRole === "admin"
      ? [{ to: "/all-teams", label: "All Teams", icon: Building2 }]
      : user?.userRole === "manager"
      ? [{ to: "/manager-dashboard", label: "My Team", icon: Users }]
      : []),
  ];

  const mobileExtraItems = [
    { to: "/profile", label: "Profile", icon: User },
    { to: "/notifications", label: "Notifications", icon: Bell },
    ...(user?.userRole === "admin" ? [{ to: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  useCommandPaletteShortcut(setPaletteOpen);
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") return true;
    if (saved === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem("theme");
      if (!saved) setDark(e.matches);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const flag = getLocationFlag(user?.location);

  return (
    <div className="flex h-screen overflow-hidden bg-background p-0 lg:gap-3 lg:p-3">
      {/* Desktop floating sidebar */}
      <aside
        className={cn(
          "relative hidden flex-shrink-0 flex-col overflow-hidden rounded-[28px] bg-sidebar shadow-sidebar transition-[width] duration-300 ease-out lg:flex",
          collapsed ? "w-[84px]" : "w-[264px]"
        )}
      >
        {/* subtle ambient glow, matches the elegant-blue accent language */}
        <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-primary/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-10 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />

        <div className={cn("relative z-10 flex items-center gap-2.5 px-5 pt-6 pb-5", collapsed && "justify-center px-0")}>
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-secondary to-accent shadow-glow-primary">
            <Sparkles className="h-[18px] w-[18px] text-white" strokeWidth={2.25} />
          </div>
          {!collapsed && (
            <span className="text-[17px] font-bold tracking-tight text-white">NERP</span>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(true)}
              aria-label="Collapse sidebar"
              className="ml-auto h-7 w-7 shrink-0 text-white/40 hover:bg-white/10 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            aria-label="Expand sidebar"
            className="relative z-10 mx-auto -mt-1 mb-3 flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white/50 transition hover:bg-white/15 hover:text-white"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Profile card */}
        <Link
          to="/profile"
          className={cn(
            "relative z-10 mx-3 mb-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 transition hover:border-white/20 hover:bg-white/10",
            collapsed && "mx-auto w-fit justify-center px-2"
          )}
        >
          <UserAvatar name={user?.name} size="h-10 w-10" fallbackClassName="text-sm font-bold" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
              <p className="truncate text-xs text-white/50">
                {user?.department} {flag}
              </p>
            </div>
          )}
        </Link>

        <nav className="relative z-10 flex-1 space-y-1 overflow-y-auto px-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            const linkContent = (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group relative flex items-center gap-3 rounded-full px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                  collapsed && "justify-center px-0",
                  isActive
                    ? "bg-primary text-white shadow-glow-primary"
                    : "text-white/55 hover:bg-white/8 hover:text-white"
                )}
              >
                <item.icon className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={isActive ? 2.25 : 2} />
                {!collapsed && item.label}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.to} delayDuration={0}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={12}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }
            return linkContent;
          })}
        </nav>

        <div className="relative z-10 space-y-1 p-3">
          <button
            onClick={handleLogout}
            className={cn(
              "flex w-full items-center gap-3 rounded-full px-3.5 py-2.5 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/15 hover:text-rose-200",
              collapsed && "justify-center px-0"
            )}
          >
            <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
            {!collapsed && "Logout"}
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative flex h-full w-[280px] flex-col bg-sidebar p-4 shadow-2xl">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-secondary to-accent">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold text-white">NERP</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="ml-auto text-white/60 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <Link
              to="/profile"
              onClick={() => setMobileOpen(false)}
              className="mb-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"
            >
              <UserAvatar name={user?.name} size="h-10 w-10" fallbackClassName="text-sm font-bold" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
                <p className="truncate text-xs text-white/50">{user?.department} {flag}</p>
              </div>
            </Link>

            <nav className="flex-1 space-y-1 overflow-y-auto">
              {[...navItems, ...mobileExtraItems].map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-full px-3.5 py-2.5 text-sm font-medium transition",
                    location.pathname === item.to
                      ? "bg-primary text-white shadow-glow-primary"
                      : "text-white/55 hover:bg-white/8 hover:text-white"
                  )}
                >
                  <item.icon className="h-[18px] w-[18px]" />
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="space-y-1 pt-2">
              <button
                onClick={() => setDark(!dark)}
                className="flex w-full items-center gap-3 rounded-full px-3.5 py-2.5 text-sm font-medium text-white/55 hover:bg-white/8 hover:text-white"
              >
                {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
                {dark ? "Light mode" : "Dark mode"}
              </button>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-full px-3.5 py-2.5 text-sm font-semibold text-rose-300 hover:bg-rose-500/15 hover:text-rose-200"
              >
                <LogOut className="h-[18px] w-[18px]" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden lg:rounded-[28px]">
        <TopNavbar
  onOpenMobileMenu={() => setMobileOpen(true)}
  dark={dark}
  onToggleDark={() => setDark(!dark)}
/>
        <main className="flex-1 min-h-0 overflow-y-auto bg-background px-4 pb-6 pt-4 sm:px-6 lg:px-8">{children}</main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}

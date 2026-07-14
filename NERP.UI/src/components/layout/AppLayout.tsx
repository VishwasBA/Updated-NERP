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
  Building2,
  Shield,
  Bell,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn, getLocationFlag } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import TopNavbar from "@/components/layout/TopNavbar";

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Primary sidebar items — kept to the compact set shown in the reference
  // design. Everything else (Profile, Notifications, Redeem History,
  // Admin) remains fully reachable via the top navbar's profile menu, so
  // no existing route or permission becomes unreachable.
  const navItems = [
    { to: "/", label: "Home", icon: Home },
    { to: "/my-recognitions", label: "Wall of Fame", icon: Award },
    { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
    {
      to: user?.userRole !== "employee" ? "/nominations" : "/appreciate",
      label: "Nominate",
      icon: Star,
    },
    { to: "/redeem", label: "Redeem", icon: Gift },
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
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-slate-950">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-white border-r border-slate-200/80 flex-shrink-0 transition-all duration-300 dark:bg-slate-950 dark:border-slate-800",
          collapsed ? "w-[76px]" : "w-72"
        )}
      >
        <div className="flex items-center gap-2 px-5 py-5">
          <img
            src="/nexerlogo.png"
            alt="Logo"
            className={cn("object-contain transition-all", collapsed ? "h-7 w-7" : "h-7")}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="ml-auto h-7 w-7 shrink-0 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Profile card */}
        <Link
          to="/profile"
          className={cn(
            "mx-3 mb-4 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 transition hover:border-blue-200 hover:bg-blue-50/60 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-900",
            collapsed && "justify-center px-2"
          )}
        >
          <UserAvatar name={user?.name} size="h-10 w-10" fallbackClassName="text-sm font-bold" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user?.name}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {user?.department} {flag}
              </p>
            </div>
          )}
        </Link>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            const linkContent = (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-sky-300"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
                )}
              >
                {isActive && (
                  <span className="absolute right-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-l-full bg-blue-600" />
                )}
                <item.icon className={cn("h-[18px] w-[18px] flex-shrink-0", isActive && "text-blue-600 dark:text-sky-300")} />
                {!collapsed && item.label}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.to} delayDuration={0}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }
            return linkContent;
          })}
        </nav>

        <div className="p-3">
          {!collapsed && (
            <button
              onClick={() => setDark(!dark)}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              className="mb-1 flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
            >
              {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
              {dark ? "Light mode" : "Dark mode"}
            </button>
          )}
          <button
            onClick={handleLogout}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/50",
              collapsed && "justify-center px-2"
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
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative flex h-full w-72 flex-col bg-white p-4 shadow-xl dark:bg-slate-950">
            <div className="mb-4 flex items-center justify-between">
              <img src="/nexerlogo.png" alt="Logo" className="h-6 object-contain" />
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <Link
              to="/profile"
              onClick={() => setMobileOpen(false)}
              className="mb-4 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/60"
            >
              <UserAvatar name={user?.name} size="h-10 w-10" fallbackClassName="text-sm font-bold" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user?.name}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.department} {flag}</p>
              </div>
            </Link>

            <nav className="flex-1 space-y-1 overflow-y-auto">
              {[...navItems, ...mobileExtraItems].map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
                    location.pathname === item.to
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-sky-300"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
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
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900"
              >
                {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
                {dark ? "Light mode" : "Dark mode"}
              </button>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-400"
              >
                <LogOut className="h-[18px] w-[18px]" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar onOpenMobileMenu={() => setMobileOpen(true)} />
        <main className="flex-1 min-h-0 overflow-y-auto bg-slate-100 dark:bg-slate-950">{children}</main>
      </div>
    </div>
  );
}

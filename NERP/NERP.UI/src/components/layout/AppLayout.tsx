import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Heart, Award, Trophy, History, Menu, X, Sun, Moon, LogOut, User, Settings, Users, BarChart3, Shield, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";


export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const navItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/appreciate", label: "Send Appreciation", icon: Heart },
    ...(user?.userRole !== "employee"
      ? [{ to: "/nominations", label: "Nominations", icon: Award }]
      : []),
    { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
    ...(user?.userRole === "manager" || user?.userRole === "admin"
      ? [{ to: "/team", label: "Team", icon: Users }]
      : []),
    ...(user?.userRole === "manager" || user?.userRole === "admin"
      ? [{ to: "/analytics", label: "Analytics", icon: BarChart3 }]
      : []),
    ...(user?.userRole === "admin" ? [{ to: "/admin", label: "User Management", icon: Shield }] : []),
    { to: "/profile", label: "Profile", icon: User },
    { to: "/my-recognitions", label: "My Recognitions", icon: History },
    { to: "/redeem-history", label: "Redeem History", icon: History },
    { to: "/notifications", label: "Notifications", icon: Bell },
    { to: "/settings", label: "Settings", icon: Settings },
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

  const avatar = user?.avatar || user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "??";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.14),_transparent_25%),linear-gradient(180deg,#020617,#0b1224)] text-white border-r border-slate-800/80 flex-shrink-0 transition-all duration-300",
          collapsed ? "w-[68px]" : "w-80"
        )}
      >
        <div className="px-6 py-5 border-b border-slate-800/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-3xl bg-slate-900 shadow-lg shadow-slate-950/20">
              <img src="/logo.png" alt="Logo" className="h-6 w-6 object-contain" />
            </div>
            {!collapsed && <h1 className="text-lg font-semibold tracking-tight">Nexer Stars</h1>}
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-hidden">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            const linkContent = (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium transition",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "bg-blue-600 text-white shadow-[0_12px_40px_rgba(59,130,246,0.24)]"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
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

        <div className="px-4 pb-6 pt-3">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-4 shadow-inner shadow-slate-950/20">
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11 bg-blue-500 text-white shadow-lg shadow-blue-500/20">
                <AvatarFallback className="text-sm font-semibold">{avatar}</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                  <p className="text-xs text-slate-400 capitalize">{user?.userRole}</p>
                </div>
              )}
            </div>

            {!collapsed && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDark(!dark)}
                  className="border border-white/10 bg-white/5 text-white hover:bg-white/10"
                >
                  {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="border border-white/10 bg-white/5 text-white hover:bg-white/10"
                >
                  <Link to="/profile">
                    <Settings className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="border border-white/10 bg-white/5 text-white hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card flex-shrink-0">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="h-5 object-contain" />
            <span className="font-bold text-foreground">Employee Recognition</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </header>

        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-background/95 backdrop-blur-sm pt-16">
            <nav className="p-4 space-y-1">
              {navItems.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors",
                    location.pathname === item.to
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/70 hover:bg-muted"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
              <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-destructive hover:bg-muted w-full">
                <LogOut className="w-5 h-5" /> Logout
              </button>
            </nav>
          </div>
        )}

        <main className="flex-1 min-h-0 overflow-hidden bg-slate-100 dark:bg-slate-950">{children}</main>
      </div>
    </div>
  );
}

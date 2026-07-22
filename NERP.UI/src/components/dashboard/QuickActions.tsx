import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Heart, Trophy, Gift, User } from "lucide-react";

const actions = [
  { to: "/appreciate", label: "Appreciate", subtext: "Recognize a colleague", icon: Heart, color: "text-rose-500 bg-rose-500/10" },
  { to: "/leaderboard", label: "View Leaderboard", subtext: "See top performers", icon: Trophy, color: "text-blue-500 bg-blue-500/10" },
  { to: "/redeem", label: "Browse Rewards", subtext: "Spend your points", icon: Gift, color: "text-emerald-500 bg-emerald-500/10" },
  { to: "/profile", label: "My Profile", subtext: "View your achievements", icon: User, color: "text-indigo-500 bg-indigo-500/10" },
];

export default function QuickActions() {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-6">
        <p className="text-base font-semibold mb-4 text-slate-950 dark:text-white">Quick Actions</p>
        <div className="grid grid-cols-2 gap-4">
          {actions.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="flex items-center gap-3.5 rounded-xl border border-border p-3.5 h-20 hover:border-primary/50 hover:bg-primary/5 transition-colors min-w-0"
            >
              <div className={`rounded-xl p-2.5 flex-shrink-0 flex items-center justify-center ${a.color}`}>
                <a.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{a.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate leading-snug">{a.subtext}</p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

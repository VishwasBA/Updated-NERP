import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Heart, Trophy, Gift, User } from "lucide-react";

const actions = [
  { to: "/appreciate", label: "Appreciate", subtext: "Recognize a colleague", icon: Heart, color: "text-rose-500 bg-rose-500/10" },
  { to: "/leaderboard", label: "View Leaderboard", subtext: "See top performers", icon: Trophy, color: "text-amber-500 bg-amber-500/10" },
  { to: "/redeem", label: "Browse Rewards", subtext: "Spend your points", icon: Gift, color: "text-emerald-500 bg-emerald-500/10" },
  { to: "/profile", label: "My Profile", subtext: "View your achievements", icon: User, color: "text-indigo-500 bg-indigo-500/10" },
];

export default function QuickActions() {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-4">
        <p className="text-sm font-semibold mb-3">Quick Actions</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {actions.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="flex items-center gap-3 rounded-xl border border-border p-3 hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <div className={`rounded-lg p-2 ${a.color}`}>
                <a.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{a.label}</p>
                <p className="text-xs text-muted-foreground">{a.subtext}</p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

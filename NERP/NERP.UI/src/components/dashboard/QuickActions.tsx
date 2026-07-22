import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Heart, Trophy, Gift, User } from "lucide-react";

const actions = [
  { to: "/appreciate", label: "Appreciate", subtext: "Recognize a colleague", icon: Heart, color: "text-destructive bg-destructive/10" },
  { to: "/leaderboard", label: "View Leaderboard", subtext: "See top performers", icon: Trophy, color: "text-primary bg-primary/10" },
  { to: "/redeem", label: "Browse Rewards", subtext: "Spend your points", icon: Gift, color: "text-success bg-success/10" },
  { to: "/profile", label: "My Profile", subtext: "View your achievements", icon: User, color: "text-accent bg-accent/10" },
];

export default function QuickActions() {
  return (
    <Card>
      <CardContent className="p-8">
        <p className="text-base font-semibold mb-4 text-foreground">Quick Actions</p>
        <div className="grid grid-cols-2 gap-4">
          {actions.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="flex items-center gap-3.5 rounded-2xl border border-border p-3.5 h-20 hover:border-primary/50 hover:bg-primary/5 transition-colors min-w-0"
            >
              <div className={`rounded-xl p-2.5 flex-shrink-0 flex items-center justify-center ${a.color}`}>
                <a.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{a.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate leading-snug">{a.subtext}</p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

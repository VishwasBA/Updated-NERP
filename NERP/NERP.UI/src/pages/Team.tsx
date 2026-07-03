import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMyTeam } from "@/hooks/useApiData";
import { Users, Heart, Coins, Trophy, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Team() {
  const { data, isLoading } = useMyTeam();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  if (isLoading) {
    return <div className="flex items-center justify-center p-12 text-muted-foreground">Loading team...</div>;
  }

  const members = (data?.members ?? []).filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: "Team Members", value: data?.teamMembers ?? 0, icon: Users },
    { label: "This Month Appreciations", value: data?.thisMonthAppreciations ?? 0, icon: Heart },
    { label: "Points Distributed", value: data?.pointsDistributed ?? 0, icon: Coins },
    { label: "Team Rank", value: 0, icon: Trophy },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" /> My Team
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage and appreciate your team members</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="rounded-2xl">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="rounded-lg p-2 bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <h3 className="text-2xl font-extrabold mt-1">{s.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Team Members</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search team members..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="divide-y divide-border">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{m.avatar || m.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <span>{m.appreciationsGiven} given</span>
                  <span>{m.appreciationsReceived} received</span>
                  <span className="font-semibold text-foreground">{m.points.toLocaleString()} pts</span>
                  <Button size="sm" onClick={() => navigate(`/appreciate?to=${m.id}`)}>
                    Appreciate
                  </Button>
                </div>
              </div>
            ))}
            {members.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">No team members found.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

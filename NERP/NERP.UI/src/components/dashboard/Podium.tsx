import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Award, Star } from "lucide-react";

interface PodiumPerson {
  id: string | number;
  name: string;
  avatar?: string | null;
  points: number;
  department?: string | null;
}

export default function Podium({ top }: { top: PodiumPerson[] }) {
  const first = top[0];
  const second = top[1];
  const third = top[2];

  return (
    <div role="list" aria-label="Top performers podium" className="podium grid grid-cols-3 gap-3 items-end">
      <div role="listitem" aria-label={second ? `${second.name}, second place, ${second.points} points` : "Second place"} className="flex flex-col items-center gap-2">
        <div className="text-sm text-muted-foreground">2</div>
        <div className="relative w-20 h-20 rounded-xl bg-card/60 border border-white/5 flex items-center justify-center p-2">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl">
            <Award className="w-6 h-6 text-slate-500" />
          </div>
          {second ? (
            <Avatar className="h-14 w-14">
              {second.avatar ? <img src={second.avatar} alt={second.name} /> : <AvatarFallback>{second.name?.[0] ?? "?"}</AvatarFallback>}
            </Avatar>
          ) : (
            <div className="text-muted-foreground">—</div>
          )}
        </div>
        <div className="text-sm font-semibold truncate text-center w-24">{second?.name}</div>
        <div className="text-xs text-muted-foreground">{second?.points?.toLocaleString()}</div>
      </div>

      <div role="listitem" aria-label={first ? `${first.name}, first place, ${first.points} points` : "First place"} className="flex flex-col items-center gap-2">
        <div className="text-sm text-muted-foreground">1</div>
        <div className="relative w-24 h-24 rounded-2xl bg-gold/10 border border-gold p-3 flex items-center justify-center">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-3xl">
            <Trophy className="w-8 h-8 text-amber-500" />
          </div>
          {first ? (
            <Avatar className="h-20 w-20">
              {first.avatar ? <img src={first.avatar} alt={first.name} /> : <AvatarFallback>{first.name?.[0] ?? "?"}</AvatarFallback>}
            </Avatar>
          ) : (
            <div className="text-muted-foreground">—</div>
          )}
        </div>
        <div className="text-sm font-semibold truncate text-center w-28">{first?.name}</div>
        <div className="text-xs text-muted-foreground">{first?.points?.toLocaleString()}</div>
      </div>

      <div role="listitem" aria-label={third ? `${third.name}, third place, ${third.points} points` : "Third place"} className="flex flex-col items-center gap-2">
        <div className="text-sm text-muted-foreground">3</div>
        <div className="relative w-20 h-20 rounded-xl bg-card/60 border border-white/5 flex items-center justify-center p-2">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl">
            <Star className="w-6 h-6 text-orange-500" />
          </div>
          {third ? (
            <Avatar className="h-14 w-14">
              {third.avatar ? <img src={third.avatar} alt={third.name} /> : <AvatarFallback>{third.name?.[0] ?? "?"}</AvatarFallback>}
            </Avatar>
          ) : (
            <div className="text-muted-foreground">—</div>
          )}
        </div>
        <div className="text-sm font-semibold truncate text-center w-24">{third?.name}</div>
        <div className="text-xs text-muted-foreground">{third?.points?.toLocaleString()}</div>
      </div>
    </div>
  );
}

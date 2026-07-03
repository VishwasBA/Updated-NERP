import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Props {
  id: number | string;
  fromName?: string;
  message?: string;
  points?: number;
  category?: string | null;
  date?: string;
  avatar?: string | null;
}

export default function TimelineItem({ id, fromName, message, points, category, date, avatar }: Props) {
  return (
    <div key={id} className="rounded-2xl border border-border p-4 hover:shadow-lg transition-transform hover:-translate-y-1 bg-card glass-dark">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          {avatar ? <img src={avatar} alt={fromName} /> : <AvatarFallback>{(fromName || "?")[0]}</AvatarFallback>}
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{fromName}</p>
            {category ? <Badge className="ml-1" variant="secondary">{category}</Badge> : null}
            <div className="ml-auto text-xs text-muted-foreground">{date}</div>
          </div>
          <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{message}</p>
        </div>
        <div className="ml-3">
          <Badge variant="secondary">+{points ?? 0} pts</Badge>
        </div>
      </div>
    </div>
  );
}

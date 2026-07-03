import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface Props {
  name?: string | null;
  avatar?: string | null;
  department?: string | null;
  role?: string | null;
  id?: number | string | null;
  email?: string | null;
  joined?: string | null;
  completion?: number;
}

export default function ProfileCard({ name, avatar, department, role, id, email, joined, completion = 60 }: Props) {
  return (
    <div className="rounded-2xl bg-white/70 dark:bg-[#0b1220]/60 backdrop-blur-md border border-border p-6 card-shadow transition-transform hover:scale-[1.01] fade-in">
      <div className="flex items-center gap-4">
        <Avatar className="h-24 w-24 shadow-lg">
          {avatar ? <img src={avatar} alt={`${name} avatar`} /> : <AvatarFallback className="text-2xl font-semibold">{(name || "?").split(" ").map(p => p[0]).join("").slice(0,2).toUpperCase()}</AvatarFallback>}
        </Avatar>
        <div className="flex-1">
          <h2 className="text-2xl font-bold leading-tight">{name ?? "Unknown User"}</h2>
          <p className="text-sm text-muted-foreground mt-1">{role ?? "Designation not available"}</p>
          <p className="text-sm text-muted-foreground mt-2">{department ?? "Department not available"}</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <Button variant="outline" size="sm">Edit Profile</Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-card p-3">
          <p className="text-xs text-muted-foreground">Employee ID</p>
          <p className="font-medium mt-1">{id ?? "—"}</p>
        </div>
        <div className="rounded-lg bg-card p-3">
          <p className="text-xs text-muted-foreground">Email</p>
          <p className="font-medium mt-1 truncate">{email ?? "—"}</p>
        </div>
        <div className="rounded-lg bg-card p-3">
          <p className="text-xs text-muted-foreground">Joined</p>
          <p className="font-medium mt-1">{joined ?? "Not available"}</p>
        </div>
        <div className="rounded-lg bg-card p-3">
          <p className="text-xs text-muted-foreground">Profile</p>
          <div className="mt-2 w-full bg-muted/30 h-3 rounded-full overflow-hidden">
            <div style={{ width: `${Math.max(0, Math.min(100, completion))}%` }} className="h-3 bg-gradient-to-r from-primary to-secondary transition-all" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{completion}% complete</p>
        </div>
      </div>
    </div>
  );
}

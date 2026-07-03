import React from "react";
import { Award } from "lucide-react";

interface Props {
  title?: string;
  badge?: string;
  description?: string;
  date?: string;
}

export default function AwardCard({ title, badge, description, date }: Props) {
  return (
    <div className="rounded-2xl border border-border p-4 bg-card hover:shadow-md transition">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-gradient-to-tr from-gold to-primary text-white">
          <Award className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold truncate">{title}</p>
          <p className="text-sm text-muted-foreground truncate mt-1">{description}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-sm">{badge}</p>
          <p className="text-xs text-muted-foreground">{date}</p>
        </div>
      </div>
    </div>
  );
}

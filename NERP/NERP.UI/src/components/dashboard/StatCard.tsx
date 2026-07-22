import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  accent: "primary" | "accent" | "success" | "warning";
  isLoading?: boolean;
}

const accentClasses: Record<StatCardProps["accent"], string> = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
};

export default function StatCard({ label, value, icon, accent, isLoading }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className={cn("flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl", accentClasses[accent])}>
          {icon}
        </div>
        <div className="min-w-0">
          {isLoading ? (
            <div className="h-7 w-14 animate-pulse rounded-md bg-muted" />
          ) : (
            <p className="text-2xl font-bold leading-tight text-foreground">{value}</p>
          )}
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

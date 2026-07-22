import React from "react";
import { ApiRecognition } from "@/services/api";
import { UserAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Award, Heart } from "lucide-react";
import { motion } from "framer-motion";

function RecognitionCard({ item }: { item: ApiRecognition }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-[24px] border border-border bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="flex gap-4">
        <UserAvatar name={item.fromEmployee?.name} size="h-12 w-12" fallbackClassName="text-sm font-bold" />

        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
            <span className="text-primary truncate">{item.fromEmployee?.name}</span>
            <span className="text-muted-foreground">→</span>
            <span className="text-accent truncate">{item.toEmployee?.name}</span>
            <span className="flex items-center ml-1">
              {item.type === "appreciation" ? (
                <span className="text-lg">👏</span>
              ) : (
                <Award className="h-4 w-4 text-accent" />
              )}
            </span>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{item.message}</p>

          <div className="flex flex-wrap items-center gap-2">
            {item.category && (
              <Badge variant="secondary" className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                {item.category.icon} {item.category.name}
              </Badge>
            )}

            {item.type === "nomination" && (
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">+{item.points} pts</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default React.memo(RecognitionCard);

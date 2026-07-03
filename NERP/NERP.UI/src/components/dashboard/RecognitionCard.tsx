import React from "react";
import { ApiRecognition } from "@/services/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Award } from "lucide-react";
import { motion } from "framer-motion";

export default function RecognitionCard({ item }: { item: ApiRecognition }) {
  const initials = item.fromEmployee?.name
    ? item.fromEmployee.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-3xl border border-slate-200/70 bg-slate-50/75 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700/60 dark:bg-slate-900/70"
    >
      <div className="flex gap-4">
        <Avatar className="h-12 w-12 shrink-0 bg-slate-900 text-white">
          {item.fromEmployee?.avatar ? (
            <img src={item.fromEmployee.avatar} alt={item.fromEmployee?.name} className="h-full w-full object-cover" />
          ) : (
            <AvatarFallback className="text-sm font-semibold">{initials}</AvatarFallback>
          )}
        </Avatar>

        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <span className="truncate">{item.fromEmployee?.name}</span>
            <span className="text-slate-400">→</span>
            <span className="truncate">{item.toEmployee?.name}</span>
            <span className="flex items-center text-amber-600">{item.type === "appreciation" ? "👏" : <Award className="h-4 w-4" />}</span>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">{item.message}</p>

          <div className="flex flex-wrap items-center gap-2">
            {item.category && (
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-semibold border border-slate-200/70 bg-slate-100 text-slate-900 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100">
                {item.category.icon} {item.category.name}
              </Badge>
            )}

            {item.type === "nomination" && (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">+{item.points} pts</span>
            )}

            <div className="ml-auto flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <button className="transition hover:text-primary">❤️ 0</button>
              <button className="transition hover:text-primary">💬 0</button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

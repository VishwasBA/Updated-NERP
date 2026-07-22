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
      className="rounded-3xl border border-slate-200/70 bg-white dark:bg-slate-900/60 p-5 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800"
    >
      <div className="flex gap-4">
        <UserAvatar name={item.fromEmployee?.name} avatar={item.fromEmployee?.avatar} size="h-12 w-12" fallbackClassName="text-sm font-bold" />

        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <span className="text-blue-600 dark:text-blue-400 truncate">{item.fromEmployee?.name}</span>
            <span className="text-slate-400">→</span>
            <span className="text-indigo-600 dark:text-indigo-400 truncate">{item.toEmployee?.name}</span>
            <span className="flex items-center ml-1">
              {item.type === "appreciation" ? (
                <span className="text-lg">👏</span>
              ) : (
                <Award className="h-4 w-4 text-indigo-600" />
              )}
            </span>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">{item.message}</p>

          <div className="flex flex-wrap items-center gap-2">
            {item.category && (
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-semibold border border-slate-200/70 bg-slate-100 text-slate-950 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100">
                {item.category.icon} {item.category.name}
              </Badge>
            )}

            {item.type === "nomination" && (
              <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">+{item.points} pts</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default React.memo(RecognitionCard);

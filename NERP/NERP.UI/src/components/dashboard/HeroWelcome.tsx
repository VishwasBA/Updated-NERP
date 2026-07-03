import React from "react";
import { motion } from "framer-motion";
import { Heart, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Props {
  name?: string | null;
  avatar?: string | null;
  monthlyPoints?: number;
  recognitionsCount?: number;
  rank?: number | null;
}

export default function HeroWelcome({ name, avatar, monthlyPoints = 0, recognitionsCount = 0, rank }: Props) {
  const displayName = name?.split(" ")[0] ?? "User";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="rounded-[2rem] border border-slate-200/70 bg-white p-7 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-slate-700/70 dark:bg-slate-950/90"
    >
      <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border border-slate-200/70 shadow-sm dark:border-slate-700/70">
            {avatar ? <img src={avatar} alt={displayName} /> : <AvatarFallback>{displayName[0]}</AvatarFallback>}
          </Avatar>
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Hello</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
              {displayName}, great work today
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-500 dark:text-slate-400">
              Keep the momentum going—recognize your teammates and continue building a positive culture.
            </p>
          </div>
        </div>

        <Button asChild className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-sky-500 px-6 text-white shadow-lg shadow-sky-500/20 hover:from-blue-700 hover:to-sky-600">
          <Link to="/appreciate">
            <Heart className="h-4 w-4" /> Appreciate
          </Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-3xl bg-slate-50 p-4 shadow-sm dark:bg-slate-900/80">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">This month</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{monthlyPoints.toLocaleString()}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Points earned</p>
        </div>
        <div className="rounded-3xl bg-slate-50 p-4 shadow-sm dark:bg-slate-900/80">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Recognitions</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{recognitionsCount}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total approved</p>
        </div>
        <div className="rounded-3xl bg-slate-50 p-4 shadow-sm dark:bg-slate-900/80">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Rank</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{rank ? `#${rank}` : "—"}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Leaderboard position</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200/70 bg-blue-50/80 p-4 text-slate-900 shadow-sm dark:border-slate-700/70 dark:bg-slate-950/70 dark:text-white">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-white/90 p-3 text-blue-600 shadow-sm dark:bg-slate-900">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">Recognition streak</p>
            <p className="text-sm text-slate-700 dark:text-slate-300">Keep recognizing colleagues to stay engaged.</p>
          </div>
        </div>
        <Link to="/leaderboard" className="text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-sky-300">
          View leaderboard
        </Link>
      </div>
    </motion.div>
  );
}

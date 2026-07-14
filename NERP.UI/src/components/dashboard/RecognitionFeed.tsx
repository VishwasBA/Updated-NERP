import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApiRecognition } from "@/services/api";
import { Award, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import RecognitionCard from "./RecognitionCard";

export default function RecognitionFeed({
  items,
}: {
  items: ApiRecognition[];
}) {
  const [filter, setFilter] = useState("all");
  const [showAll, setShowAll] = useState(false);

  // PERFORMANCE: these were being recomputed on every render (e.g. any
  // unrelated state change elsewhere in the tree that re-renders the
  // Dashboard), including a fresh .filter() pass over the whole list each
  // time. Memoizing means they only recompute when items/filter/showAll
  // actually change.
  const filteredItems = useMemo(() => {
    return items.filter((r) => {
      if (filter === "all") return true;
      if (filter === "appreciation") return r.type === "appreciation";
      if (filter === "award") return r.type === "nomination";
      return true;
    });
  }, [items, filter]);

  const displayedItems = useMemo(
    () => (showAll ? filteredItems : filteredItems.slice(0, 5)),
    [showAll, filteredItems]
  );

  const appreciationCount = useMemo(
    () => items.filter((r) => r.type === "appreciation").length,
    [items]
  );

  const nominationCount = useMemo(
    () => items.filter((r) => r.type === "nomination").length,
    [items]
  );

  return (
    <Card className="h-full min-h-0 rounded-[2rem] border border-slate-200/70 bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-slate-700/70 dark:bg-slate-950/85">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-2xl font-semibold">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Recent Recognitions
          </CardTitle>

          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {filteredItems.length} recognition
            {filteredItems.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setFilter("all");
              setShowAll(false);
            }}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${filter === "all"
              ? "bg-blue-600 text-white"
              : "border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              }`}
          >
            All ({items.length})
          </button>

          <button
            onClick={() => {
              setFilter("appreciation");
              setShowAll(false);
            }}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${filter === "appreciation"
              ? "bg-blue-600 text-white"
              : "border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              }`}
          >
            Appreciations ({appreciationCount})
          </button>

          <button
            onClick={() => {
              setFilter("award");
              setShowAll(false);
            }}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${filter === "award"
              ? "bg-blue-600 text-white"
              : "border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              }`}
          >
            Nominations ({nominationCount})
          </button>
        </div>
      </CardHeader>

      <CardContent className="flex h-full min-h-0 flex-col p-0">
        {filteredItems.length === 0 ? (
          <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center gap-4 px-8 py-12 text-center text-slate-500 dark:text-slate-400">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-100 text-blue-700 dark:bg-slate-900 dark:text-sky-400">
              <Award className="h-7 w-7" />
            </div>

            <div>
              <p className="text-lg font-semibold text-slate-950 dark:text-white">
                No recognitions yet
              </p>

              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Be the first to recognize and appreciate your amazing
                colleagues!
              </p>
            </div>

            <Button
              asChild
              className="rounded-full bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
            >
              <Link to="/appreciate">
                Send Appreciation
              </Link>
            </Button>
          </div>
        ) : (
          <div className="px-4 pb-4 pt-2 space-y-4">
            {displayedItems.map((r) => (
              <RecognitionCard
                key={r.id}
                item={r}
              />
            ))}
          </div>
        )}

        <div className="flex justify-center border-t border-slate-200/70 px-4 py-4 dark:border-slate-700/70">
          {filteredItems.length > 5 ? (
            <Button
              onClick={() => setShowAll(!showAll)}
              variant="outline"
              className="rounded-full border-slate-300 bg-slate-50 px-5 text-sm font-semibold text-slate-900 transition hover:border-blue-500 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <span className="inline-flex items-center gap-2">
                {showAll ? "Show Less" : "View All Recognitions"}
                <ArrowRight className={`h-4 w-4 transition-transform ${showAll ? "rotate-90" : ""}`} />
              </span>
            </Button>
          ) : (
            <Button
              asChild
              variant="outline"
              className="rounded-full border-slate-300 bg-slate-50 px-5 text-sm font-semibold text-slate-900 transition hover:border-blue-500 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <Link to="/my-recognitions" className="inline-flex items-center gap-2">
                View All Recognitions
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
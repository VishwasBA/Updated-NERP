import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRedeemHistory } from "@/hooks/useApiData";

const statusStyles: Record<string, string> = {
  delivered: "text-emerald-600",
  processing: "text-amber-600",
  pending: "text-amber-600",
  rejected: "text-rose-600",
};

export default function MyOrdersPanel() {
  const { data: history = [], isLoading } = useRedeemHistory();
  const [search, setSearch] = useState("");

  const filtered = history.filter((h) => h.productTitle.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-bold text-slate-950 dark:text-white">My Orders</h2>

      <div className="relative sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search orders"
          className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-700 dark:bg-slate-900"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
              <th className="px-4 py-3">Reward</th>
              <th className="px-4 py-3">Points</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  No orders yet.
                </td>
              </tr>
            ) : (
              filtered.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <td className="px-4 py-3 font-medium text-slate-950 dark:text-white">{h.productTitle}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{h.points.toLocaleString()} pts</td>
                  <td className={cn("px-4 py-3 text-xs font-semibold capitalize", statusStyles[h.status] ?? "text-slate-500")}>
                    {h.status}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {new Date(h.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

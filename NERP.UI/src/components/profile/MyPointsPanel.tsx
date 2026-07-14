import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ShoppingCart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { recognitionsApi } from "@/services/api";
import { useRedeemHistory } from "@/hooks/useApiData";

interface LedgerRow {
  id: string;
  date: string;
  received: number;
  redeemed: number;
  balance: number;
  description: string;
  status: string;
}

export default function MyPointsPanel() {
  const { user } = useAuth();
  const { data: recognitions = [], isLoading: recLoading } = useQuery({
    queryKey: ["recognitions", "my", "received", "points-ledger"],
    queryFn: () => recognitionsApi.getMy({ direction: "received", pageSize: 1000 }),
    staleTime: 60_000,
  });
  const { data: redemptions = [], isLoading: redLoading } = useRedeemHistory();
  const [search, setSearch] = useState("");

  const isLoading = recLoading || redLoading;

  // Build a chronological ledger from two real sources: points earned via
  // approved recognitions received, and points spent via reward
  // redemptions. Running balance is accumulated forward from 0 so the
  // "Balance" column reflects genuine arithmetic over real events rather
  // than any fabricated figure.
  const { rows, earned, redeemed } = useMemo(() => {
    type Ev = { date: string; earn: number; spend: number; description: string; status: string };
    const events: Ev[] = [];

    recognitions
      .filter((r) => r.points > 0)
      .forEach((r) => {
        events.push({
          date: r.createdAt,
          earn: r.points,
          spend: 0,
          description: r.category?.name ?? (r.type === "nomination" ? "Nomination" : "Appreciation"),
          status: "Active",
        });
      });

    redemptions.forEach((h) => {
      events.push({
        date: h.createdAt,
        earn: 0,
        spend: h.points,
        description: h.productTitle,
        status: h.status.charAt(0).toUpperCase() + h.status.slice(1),
      });
    });

    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let balance = 0;
    let totalEarned = 0;
    let totalRedeemed = 0;
    const built: LedgerRow[] = events.map((e, i) => {
      balance += e.earn - e.spend;
      totalEarned += e.earn;
      totalRedeemed += e.spend;
      return {
        id: `${e.date}-${i}`,
        date: e.date,
        received: e.earn,
        redeemed: e.spend,
        balance,
        description: e.description,
        status: e.status,
      };
    });

    return { rows: built.reverse(), earned: totalEarned, redeemed: totalRedeemed };
  }, [recognitions, redemptions, user?.id]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.description.toLowerCase().includes(q) || r.status.toLowerCase().includes(q));
  }, [rows, search]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">Reward Points</h2>
        <Link
          to="/redeem"
          className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
        >
          <ShoppingCart className="h-4 w-4" /> Redeem
        </Link>
      </div>

      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium text-slate-400">Total Reward Points Earned</p>
          <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{earned.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400">Total Reward Points Redeemed</p>
          <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{redeemed.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400">Available Reward Points Balance</p>
          <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-sky-400">
            {(user?.totalPoints ?? 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="relative sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search reward points history"
          className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-700 dark:bg-slate-900"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
              <th className="px-4 py-3">Received Date</th>
              <th className="px-4 py-3">Reward Points(s) Received</th>
              <th className="px-4 py-3">Reward Points(s) Redeemed</th>
              <th className="px-4 py-3">Reward Points(s) Balance</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No reward points history yet.
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-950 dark:text-white">
                    {r.received > 0 ? r.received.toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-950 dark:text-white">
                    {r.redeemed > 0 ? r.redeemed.toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 font-semibold text-blue-600 dark:text-sky-400">
                    {r.balance.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.description}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        r.status === "Active" || r.status === "Delivered"
                          ? "text-xs font-semibold text-emerald-600"
                          : r.status === "Rejected"
                          ? "text-xs font-semibold text-rose-600"
                          : "text-xs font-semibold text-amber-600"
                      }
                    >
                      {r.status}
                    </span>
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

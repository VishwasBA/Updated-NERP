import { Card, CardContent } from "@/components/ui/card";
import { useAnalyticsOverview } from "@/hooks/useApiData";
import { BarChart3, Users, Coins, RefreshCcw } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";

export default function Analytics() {
  const { data, isLoading } = useAnalyticsOverview(6);

  if (isLoading) {
    return <div className="flex items-center justify-center p-12 text-muted-foreground">Loading analytics...</div>;
  }

  const stats = [
    { label: "Total Appreciations", value: data?.totalAppreciations ?? 0, icon: BarChart3 },
    { label: "Active Users", value: data?.activeUsers ?? 0, icon: Users },
    { label: "Points Issued", value: data?.pointsIssued ?? 0, icon: Coins },
    { label: "Redemption Rate", value: `${data?.redemptionRate ?? 0}%`, icon: RefreshCcw },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" /> Analytics Overview
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Insights into recognition and engagement</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="rounded-2xl">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="rounded-lg p-2 bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <h3 className="text-2xl font-extrabold mt-1">{s.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <h2 className="font-semibold mb-4">Appreciations Over Time</h2>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data?.appreciationsOverTime ?? []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="label" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <h2 className="font-semibold mb-4">Top Categories</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data?.topCategories ?? []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" fontSize={11} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <h2 className="font-semibold mb-4">Department Engagement</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-4">Department</th>
                  <th className="py-2 pr-4">Employees</th>
                  <th className="py-2 pr-4">Recognitions</th>
                  <th className="py-2 pr-4">Participation Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(data?.departmentEngagement ?? []).map((d) => (
                  <tr key={d.department}>
                    <td className="py-2 pr-4 font-medium">{d.department}</td>
                    <td className="py-2 pr-4">{d.employees}</td>
                    <td className="py-2 pr-4">{d.recognitions}</td>
                    <td className="py-2 pr-4">{d.participationRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

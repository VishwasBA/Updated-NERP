import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

interface Props {
  data: { name: string; value: number }[];
}

const COLORS = ["#2563EB", "#7C3AED", "#22C55E", "#F59E0B", "#3B82F6", "#EF4444"];

export default function TopCategoriesDonut({ data }: Props) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Top Categories</CardTitle>
        <p className="text-xs text-muted-foreground">Last 6 months</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4">
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={40} outerRadius={65} paddingAngle={2}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 space-y-1.5">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-foreground">
                <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                {d.name}
              </span>
              <span className="text-muted-foreground">{Math.round((d.value / total) * 100)}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

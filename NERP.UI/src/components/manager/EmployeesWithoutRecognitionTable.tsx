import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, Star, PartyPopper } from "lucide-react";
import { ApiEmployeeWithoutRecognition } from "@/services/api";

interface Props {
  items: ApiEmployeeWithoutRecognition[];
  isLoading?: boolean;
}

export default function EmployeesWithoutRecognitionTable({ items, isLoading }: Props) {
  const navigate = useNavigate();

  const goAppreciate = (employeeId: number) => navigate("/appreciate", { state: { employeeId } });
  const goNominate = (employeeId: number) => navigate("/nominations", { state: { employeeId } });

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Employees Without Recognition</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <p className="px-6 py-8 text-center text-sm text-muted-foreground">Loading...</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <PartyPopper className="h-8 w-8 text-emerald-500" />
            <p className="text-sm font-medium">Every direct report has been recognized recently. Nice work!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-6 py-2.5 font-medium">Employee</th>
                  <th className="px-4 py-2.5 font-medium">Department</th>
                  <th className="px-4 py-2.5 font-medium">Days Since Last Appreciation</th>
                  <th className="px-4 py-2.5 font-medium">Current Points</th>
                  <th className="px-6 py-2.5 text-right font-medium">Manager Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((e) => (
                  <tr key={e.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={e.name} size="h-8 w-8" fallbackClassName="text-xs font-bold" />
                        <span className="font-medium text-slate-900 dark:text-white">{e.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{e.department}</td>
                    <td className="px-4 py-3">
                      {e.daysSinceLastAppreciation === null ? (
                        <Badge variant="destructive">Never appreciated</Badge>
                      ) : (
                        <span className="text-slate-700 dark:text-slate-300">{e.daysSinceLastAppreciation} days</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{e.currentPoints}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => goAppreciate(e.id)}>
                          <Heart className="h-3.5 w-3.5" /> Recognize
                        </Button>
                        <Button size="sm" className="gap-1.5" onClick={() => goNominate(e.id)}>
                          <Star className="h-3.5 w-3.5" /> Nominate
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

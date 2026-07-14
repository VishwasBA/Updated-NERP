import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { UserPlus, X, Search } from "lucide-react";
import { toast } from "sonner";
import {
  useAvailableEmployees,
  useAddTeamMember,
  useRemoveTeamMember,
} from "@/hooks/useApiData";
import { ApiTeamMember } from "@/services/api";

interface Props {
  members: ApiTeamMember[];
}

export default function ManageTeamPanel({ members }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: available = [], isLoading: availableLoading } = useAvailableEmployees(search);
  const addMember = useAddTeamMember();
  const removeMember = useRemoveTeamMember();

  const handleAdd = (id: number, name: string) => {
    addMember.mutate(id, {
      onSuccess: () => toast.success(`${name} added to your team`),
      onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Failed to add employee"),
    });
  };

  const handleRemove = (id: number, name: string) => {
    removeMember.mutate(id, {
      onSuccess: () => toast.success(`${name} removed from your team`),
      onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Failed to remove employee"),
    });
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Manage Team</CardTitle>
        <Button size="sm" className="gap-1.5" onClick={() => setPickerOpen((o) => !o)}>
          <UserPlus className="h-3.5 w-3.5" />
          {pickerOpen ? "Close" : "Add Employee"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {pickerOpen && (
          <div className="space-y-3 rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search unassigned employees by name or department..."
                className="pl-9"
              />
            </div>

            <div className="max-h-64 space-y-1 overflow-y-auto">
              {availableLoading ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Searching...</p>
              ) : available.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No unassigned employees found{search ? " for that search" : ""}.
                </p>
              ) : (
                available.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  >
                    <UserAvatar name={e.name} avatar={e.avatar} size="h-8 w-8" fallbackClassName="text-xs font-bold" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{e.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{e.department}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={addMember.isPending}
                      onClick={() => handleAdd(e.id, e.name)}
                    >
                      Add
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="space-y-1">
          {members.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No one is on your team yet — use "Add Employee" to build it out.
            </p>
          ) : (
            members.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-slate-50 dark:hover:bg-slate-900/50"
              >
                <UserAvatar name={m.name} avatar={m.avatar} size="h-8 w-8" fallbackClassName="text-xs font-bold" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{m.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.department}</p>
                </div>
                <button
                  onClick={() => handleRemove(m.id, m.name)}
                  disabled={removeMember.isPending}
                  aria-label={`Remove ${m.name} from team`}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

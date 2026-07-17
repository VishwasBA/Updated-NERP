import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { UserPlus, UserMinus, Search, Users, ChevronRight, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import {
  useAvailableEmployees,
  useAddTeamMember,
  useRemoveTeamMember,
} from "@/hooks/useApiData";
import { ApiTeamMember } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  members: ApiTeamMember[];
}

function TeamNode({
  node,
  onRemove,
  removePending,
  isDirectReport,
}: {
  node: ApiTeamMember;
  onRemove: (id: number, name: string) => void;
  removePending: boolean;
  isDirectReport: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasReports = node.reports && node.reports.length > 0;

  return (
    <div className="space-y-2">
      <div className="group relative flex items-center gap-3 rounded-xl border border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950/50 px-4 py-3 shadow-sm hover:shadow-md transition duration-200">
        {/* Branch connector visual */}
        <div className="absolute -left-6 top-1/2 h-0.5 w-4 bg-slate-200 dark:bg-slate-800" />

        <UserAvatar name={node.name} avatar={node.avatar} size="h-9 w-9" fallbackClassName="text-xs font-bold" />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white leading-none">{node.name}</p>
            {hasReports && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="inline-flex items-center gap-1 text-[10px] bg-indigo-50 dark:bg-indigo-950/55 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold transition"
              >
                {expanded ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronRight className="h-2.5 w-2.5" />}
                {expanded ? "Collapse" : `Expand (${node.reports?.length})`}
              </button>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground mt-1">
            {node.role} · <span className="font-medium text-slate-500">{node.department}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-1 rounded">
            {node.points.toLocaleString()} pts
          </span>
          {isDirectReport && (
            <button
              onClick={() => onRemove(node.id, node.name)}
              disabled={removePending}
              title={`Remove ${node.name} from team`}
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 shrink-0"
            >
              <UserMinus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {expanded && hasReports && (
        <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 ml-5 space-y-3 pt-1">
          {node.reports?.map((child) => (
            <TeamNode
              key={child.id}
              node={child}
              onRemove={onRemove}
              removePending={removePending}
              isDirectReport={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ManageTeamPanel({ members }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { user } = useAuth();

  const { data: available = [], isLoading: availableLoading } = useAvailableEmployees(search);
  const addMember = useAddTeamMember();
  const removeMember = useRemoveTeamMember();

  const handleAdd = (id: number, name: string) => {
    addMember.mutate(id, {
      onSuccess: () => {
        toast.success(`${name} added to your team successfully! 🎉`);
        setPickerOpen(false);
        setSearch("");
      },
      onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Failed to add employee"),
    });
  };

  const handleRemove = (id: number, name: string) => {
    removeMember.mutate(id, {
      onSuccess: () => toast.success(`${name} removed from your team`),
      onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Failed to remove employee"),
    });
  };

  const getManagerTitle = (role?: string) => {
    if (role === "admin") return "HR/Admin Dashboard";
    if (role === "bu_manager") return "BU Manager";
    return "CU Manager";
  };

  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-950 dark:border-slate-800 shadow-sm overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-500" />
          <CardTitle className="text-lg font-bold text-slate-950 dark:text-white">Team Members & Hierarchy</CardTitle>
        </div>
        {user?.userRole !== "admin" && (
          <Button size="sm" className="gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700 font-semibold" onClick={() => setPickerOpen((o) => !o)}>
            <UserPlus className="h-4 w-4" />
            {pickerOpen ? "Hide Panel" : "Add Team Member"}
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* ADD MEMBER PICKER */}
        {pickerOpen && (
          <div className="space-y-4 rounded-xl border border-dashed border-slate-300 p-5 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-900/10">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Assign Direct Reports</h3>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search unassigned users by name or department..."
                className="pl-9 bg-white dark:bg-slate-950"
              />
            </div>

            <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
              {availableLoading ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Searching unassigned directory...</p>
              ) : available.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No eligible unassigned members found{search ? " for that search" : ""}.
                </p>
              ) : (
                available.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center gap-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2.5 shadow-sm transition hover:shadow-md"
                  >
                    <UserAvatar name={e.name} avatar={e.avatar} size="h-9 w-9" fallbackClassName="text-xs font-bold" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{e.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{e.department} · {e.role}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={addMember.isPending}
                      onClick={() => handleAdd(e.id, e.name)}
                      className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-semibold"
                    >
                      Add to Team
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* HIERARCHY TREE LAYOUT */}
        <div className="space-y-4">
          {/* Parent Node (Current Manager) */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 rounded-xl p-4 border border-indigo-100/50 dark:border-indigo-900/30">
            <UserAvatar name={user?.name ?? "Manager"} avatar={user?.avatar} size="h-10 w-10" fallbackClassName="text-sm font-bold" />
            <div>
              <p className="font-bold text-slate-900 dark:text-white leading-none">{user?.name}</p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-semibold">
                {getManagerTitle(user?.userRole)}
              </p>
            </div>
            <div className="ml-auto bg-white dark:bg-slate-900 px-3 py-1 rounded-full text-xs font-bold shadow-sm text-slate-600 dark:text-slate-400">
              {members.length} Direct Report{members.length !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Children Nodes (Direct Reports) */}
          <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 ml-5 space-y-3">
            {members.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground italic pl-2">
                No direct reporting members assigned yet. Use the "Add Team Member" panel above to build your team.
              </p>
            ) : (
              members.map((m) => (
                <TeamNode
                  key={m.id}
                  node={m}
                  onRemove={handleRemove}
                  removePending={removeMember.isPending}
                  isDirectReport={user?.userRole !== "admin"}
                />
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

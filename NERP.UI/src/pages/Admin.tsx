import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAdminUsers,
  useUpdateUserRole,
  useUpdateUserStatus,
  useUpdateUserManager,
  useManagerOptions,
  useDeleteUser,
  useTriggerMilestones,
} from "@/hooks/useApiData";
import { Shield, Search, Trash2, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { useToast } from "@/components/ui/use-toast";

export default function Admin() {
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const { data: users = [], isLoading } = useAdminUsers({ role: roleFilter });
  const { data: managerOptions = [] } = useManagerOptions();
  const updateRole = useUpdateUserRole();
  const updateStatus = useUpdateUserStatus();
  const updateManager = useUpdateUserManager();
  const deleteUser = useDeleteUser();
  const triggerMilestones = useTriggerMilestones();
  const { toast } = useToast();

  const handleAssignManager = (id: number, value: string) => {
    updateManager.mutate(
      { id, managerId: value === "none" ? null : Number(value) },
      {
        onError: (err: any) =>
          toast({
            title: "Couldn't assign manager",
            description: err.message || "Something went wrong.",
            variant: "destructive",
          }),
      }
    );
  };

  const handleTriggerMilestones = async () => {
    try {
      const res = await triggerMilestones.mutateAsync();
      toast({
        title: "Milestones Scanned",
        description: res.message || "Milestone notifications posted successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Error scanning milestones",
        description: err.message || "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  const filtered = useMemo(
    () =>
      users.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
      ),
    [users, search]
  );

  return (
    <div className="container-page space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" /> User Management
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage users and their access</p>
        </div>
        <Button
          onClick={handleTriggerMilestones}
          disabled={triggerMilestones.isPending}
          className="flex items-center gap-2 rounded-xl shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 ${triggerMilestones.isPending ? "animate-spin" : ""}`} />
          {triggerMilestones.isPending ? "Scanning..." : "Scan Milestones"}
        </Button>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Department</th>
                  <th className="py-2 pr-4">Reporting Manager</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      Loading users...
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u.id}>
                      <td className="py-2 pr-4 font-medium">{u.name}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{u.email}</td>
                      <td className="py-2 pr-4">
                        <Select
                          value={u.userRole}
                          onValueChange={(val) => updateRole.mutate({ id: u.id, userRole: val })}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="employee">Employee</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-2 pr-4">{u.department}</td>
                      <td className="py-2 pr-4">
                        <Select
                          value={u.managerId ? String(u.managerId) : "none"}
                          onValueChange={(val) => handleAssignManager(u.id, val)}
                        >
                          <SelectTrigger className="w-40 h-8">
                            <SelectValue placeholder="No manager" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No manager</SelectItem>
                            {managerOptions
                              .filter((m) => m.id !== u.id)
                              .map((m) => (
                                <SelectItem key={m.id} value={String(m.id)}>
                                  {m.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-2 pr-4">
                        <Badge
                          className="cursor-pointer"
                          variant={u.isActive ? "default" : "destructive"}
                          onClick={() => updateStatus.mutate({ id: u.id, isActive: !u.isActive })}
                        >
                          {u.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4 text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteUser.mutate(u.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

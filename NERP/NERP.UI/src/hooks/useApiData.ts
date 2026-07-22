import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  employeesApi,
  categoriesApi,
  recognitionsApi,
  dashboardApi,
  CreateRecognitionRequest,
  ApiProduct,
  ApiEmployee,
  ApiRecognition,
  ApiAwardCategory,
  ApiDashboardSummary,
  adminApi,
  notificationsApi,
  teamApi,
  milestonesApi,
  analyticsApi,
} from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

const sharedQueryOptions = {
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 10,
  refetchOnWindowFocus: false,
  retry: false,
};

export function useEmployees() {
  return useQuery<ApiEmployee[]>({
    queryKey: ["employees"],
    queryFn: employeesApi.getAll,
    ...sharedQueryOptions,
  });
}

export function useAwardCategories() {
  return useQuery<ApiAwardCategory[]>({
    queryKey: ["awardCategories"],
    queryFn: categoriesApi.getAll,
    ...sharedQueryOptions,
  });
}

export function useRecognitions(params?: { status?: string; type?: string }) {
  return useQuery<ApiRecognition[]>({
    queryKey: ["recognitions", params?.status ?? "all", params?.type ?? "all"],
    queryFn: async () => {
      try {
        const res = await recognitionsApi.getAll(params);
        return Array.isArray(res) ? res : [];
      } catch (error) {
        console.error("Error fetching recognitions:", error);
        return [];
      }
    },
    ...sharedQueryOptions,
  });
}

// Org-wide approved recognitions (appreciations + nominations), fetched
// once with a large pageSize and filtered client-side per employee. Mirrors
// the same pattern already used by useWallOfFameAwards — no new backend
// route, just a bigger page of the existing GET /recognitions endpoint.
// Powers the per-employee recognition history + trend on the Employee
// Profile page.
export function useOrgRecognitions() {
  return useQuery<ApiRecognition[]>({
    queryKey: ["recognitions", "org-all-approved"],
    queryFn: async () => {
      const res = await recognitionsApi.getAll({ status: "approved", pageSize: 2000 });
      return Array.isArray(res) ? res : [];
    },
    ...sharedQueryOptions,
  });
}

export function useRecentRecognitions(limit = 4) {
  return useQuery<ApiRecognition[]>({
    queryKey: ["recognitions", "recent", limit],
    queryFn: () => recognitionsApi.getAll({ status: "approved" }),
    // Use React Query `select` to transform and memoize the list client-side.
    select: (res: ApiRecognition[]) => {
      const list = Array.isArray(res) ? res : [];
      return list
        .slice()
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        .slice(0, limit);
    },
    ...sharedQueryOptions,
  });
}

export function useRecentApprovedNominations(limit = 4) {
  return useQuery<ApiRecognition[]>({
    queryKey: ["recognitions", "recent-approved-nominations", limit],
    queryFn: () => recognitionsApi.getRecentApprovedNominations(),
    select: (res: ApiRecognition[]) => {
      const list = Array.isArray(res) ? res : [];
      return list
        .slice()
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        .slice(0, limit);
    },
    ...sharedQueryOptions,
  });
}

export function useMyRecognitions() {
  return useQuery<ApiRecognition[]>({
    queryKey: ["recognitions", "my"],
    // NOTE: must be wrapped in a closure. react-query calls queryFn with its
    // own QueryFunctionContext ({ queryKey, signal, meta, ... }); passing
    // recognitionsApi.getMy directly meant that context object was being
    // forwarded as the `params` argument and serialized into the request's
    // query string instead of the intended (empty) filters.
    queryFn: () => recognitionsApi.getMy(),
    ...sharedQueryOptions,
  });
}

export function useDashboardSummary() {
  return useQuery<ApiDashboardSummary>({
    queryKey: ["dashboard", "summary"],
    queryFn: dashboardApi.getSummary,
    ...sharedQueryOptions,
  });
}

export function useCreateRecognition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRecognitionRequest) => recognitionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recognitions"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useApproveRecognition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => recognitionsApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recognitions"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useRejectRecognition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => recognitionsApi.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recognitions"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ---- Peer review queue (Employee of the Quarter, Rising Star) ----
export function usePeerReviewQueue() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["recognitions", "peer-review-queue"],
    queryFn: () => recognitionsApi.getPeerReviewQueue(),
    enabled: user?.userRole === "manager" || user?.userRole === "admin",
    ...sharedQueryOptions,
  });
}

export function usePeerApprove() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => recognitionsApi.peerApprove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recognitions"] });
    },
  });
}

export function usePeerReject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => recognitionsApi.peerReject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recognitions"] });
    },
  });
}

// ---- Marketplace hooks ----
import { productsApi } from "@/services/api";

export function useProducts() {
  return useQuery<ApiProduct[]>({
    queryKey: ["marketplace", "products"],
    queryFn: productsApi.getAll,
    ...sharedQueryOptions,
  });
}

export function useRedeemProduct() {
  const queryClient = useQueryClient();
  const auth = useAuth();

  return useMutation({
    mutationFn: (productId: number) => productsApi.redeem(productId),
    // Optimistic update: deduct product price from current user's points
    onMutate: async (productId: number) => {
      await queryClient.cancelQueries({ queryKey: ["marketplace", "products"] });
      await queryClient.cancelQueries({ queryKey: ["employees"] });

      const previousProducts = queryClient.getQueryData<ApiProduct[]>(["marketplace", "products"]);
      const previousEmployees = queryClient.getQueryData<ApiEmployee[]>(["employees"]);

      const product = previousProducts?.find((p) => p.id === productId);
      const price = product?.price ?? 0;
      const currentUser = auth.user;

      if (auth.updatePoints) auth.updatePoints(-price);

      if (previousEmployees) {
        queryClient.setQueryData<ApiEmployee[]>(["employees"], () =>
          previousEmployees.map((e) =>
            currentUser && e.id === currentUser.id
              ? { ...e, totalPoints: (e.totalPoints || 0) - price }
              : e
          )
        );
      }

      return { previousProducts, previousEmployees, price };
    },
    onError: (err, variables, context) => {
      if (context?.previousEmployees) {
        queryClient.setQueryData(["employees"], context.previousEmployees);
      }
      if (context?.previousProducts) {
        queryClient.setQueryData(["marketplace", "products"], context.previousProducts);
      }

      if (auth.updatePoints && typeof context?.price === "number") {
        auth.updatePoints(context.price);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace", "products"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

// ---- Admin ----
export function useAdminUsers(params?: { role?: string; department?: string }) {
  return useQuery({
    queryKey: ["admin", "users", params?.role ?? "all", params?.department ?? "all"],
    queryFn: () => adminApi.getUsers(params),
    ...sharedQueryOptions,
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userRole }: { id: number; userRole: string }) => adminApi.updateRole(id, userRole),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => adminApi.updateStatus(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useUpdateUserManager() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, managerId }: { id: number; managerId: number | null }) =>
      adminApi.updateManager(id, managerId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useManagerOptions() {
  return useQuery({
    queryKey: ["admin", "managers"],
    queryFn: () => adminApi.getManagerOptions(),
    ...sharedQueryOptions,
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminApi.deleteUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useTriggerMilestones() {
  return useMutation({
    mutationFn: () => adminApi.triggerMilestones(),
  });
}

// ---- Notifications ----
export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: notificationsApi.getAll,
    ...sharedQueryOptions,
    refetchInterval: 30000,
  });
}

// ---- Wall of Fame ----

// Org-wide approved award/nomination feed for the Wall of Fame "Awards"
// tab. Reuses the existing GET /recognitions endpoint (no new backend
// route); a large pageSize mirrors the pattern already used elsewhere in
// this codebase (see MyRecognitions.tsx) to get an effectively-complete
// list for client-side paging/counting.
export function useWallOfFameAwards() {
  return useQuery<ApiRecognition[]>({
    queryKey: ["wall-of-fame", "awards"],
    queryFn: () => recognitionsApi.getAll({ type: "nomination", status: "approved", pageSize: 2000 }),
    ...sharedQueryOptions,
  });
}

// Org-wide birthday/anniversary feed for the Wall of Fame "Milestones"
// tab, via the new additive GET /notifications/milestones/feed endpoint.
export function useWallOfFameMilestones() {
  return useQuery({
    queryKey: ["wall-of-fame", "milestones"],
    queryFn: () => notificationsApi.getMilestonesFeed(),
    ...sharedQueryOptions,
  });
}

// Lightweight count of recognitions received by the current user, used for
// the "Received" indicator in the top navbar. Reuses the existing
// GET /recognitions/my?direction=received endpoint.
export function useReceivedRecognitionsCount() {
  return useQuery<number>({
    queryKey: ["recognitions", "received-count"],
    queryFn: async () => {
      const res = await recognitionsApi.getMy({ direction: "received", pageSize: 1000 });
      return Array.isArray(res) ? res.length : 0;
    },
    ...sharedQueryOptions,
  });
}

// Mirrors useReceivedRecognitionsCount for the "Sent" dashboard stat card,
// via the same endpoint with direction=sent.
export function useSentRecognitionsCount() {
  return useQuery<number>({
    queryKey: ["recognitions", "sent-count"],
    queryFn: async () => {
      const res = await recognitionsApi.getMy({ direction: "sent", pageSize: 1000 });
      return Array.isArray(res) ? res.length : 0;
    },
    ...sharedQueryOptions,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

// ---- Redeem History ----
export function useRedeemHistory() {
  return useQuery({
    queryKey: ["marketplace", "history"],
    queryFn: productsApi.getHistory,
    ...sharedQueryOptions,
  });
}

// ---- Manager Dashboard ----
export function useManagerDashboard() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["team", "dashboard"],
    queryFn: () => teamApi.getDashboard(),
    enabled: user?.userRole === "manager" || user?.userRole === "admin",
    ...sharedQueryOptions,
  });
}

// ---- Personal Milestones ----
export function useMyMilestones() {
  return useQuery({
    queryKey: ["milestones", "me"],
    queryFn: () => milestonesApi.getMine(),
    ...sharedQueryOptions,
  });
}

// Achievement grid for any employee (Employee Profile page). Disabled until
// a valid id is known, same gating pattern as useTeamForManager.
export function useEmployeeMilestones(employeeId?: number) {
  return useQuery({
    queryKey: ["milestones", "employee", employeeId],
    queryFn: () => milestonesApi.getForEmployee(employeeId!),
    enabled: !!employeeId,
    ...sharedQueryOptions,
  });
}

// ---- Analytics overview (department engagement etc.) ----
// Backend restricts GET /analytics/overview to admin/manager roles, so this
// mirrors useManagerDashboard's `enabled` gating rather than firing (and
// 403'ing) for employees.
export function useAnalyticsOverview(months = 6) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["analytics", "overview", months],
    queryFn: () => analyticsApi.getOverview(months),
    enabled: user?.userRole === "manager" || user?.userRole === "admin",
    ...sharedQueryOptions,
  });
}

// ---- Recognition reactions (like/comments) ----
export function useToggleLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recognitionId: number) => recognitionsApi.toggleLike(recognitionId),
    onSuccess: () => {
      // Any list that renders a like count could contain this card —
      // invalidate broadly rather than trying to patch every cache entry.
      queryClient.invalidateQueries({ queryKey: ["recognitions"] });
      queryClient.invalidateQueries({ queryKey: ["wall-of-fame"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useRecognitionComments(recognitionId: number | null) {
  return useQuery({
    queryKey: ["recognitions", "comments", recognitionId],
    queryFn: () => recognitionsApi.getComments(recognitionId!),
    enabled: recognitionId !== null,
    ...sharedQueryOptions,
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ recognitionId, message }: { recognitionId: number; message: string }) =>
      recognitionsApi.addComment(recognitionId, message),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["recognitions", "comments", variables.recognitionId] });
      queryClient.invalidateQueries({ queryKey: ["recognitions"] });
      queryClient.invalidateQueries({ queryKey: ["wall-of-fame"] });
    },
  });
}

// ---- Manager self-service team membership ----
export function useAvailableEmployees(search: string) {
  return useQuery({
    queryKey: ["team", "available", search],
    queryFn: () => teamApi.getAvailableEmployees(search || undefined),
    ...sharedQueryOptions,
  });
}

export function useAddTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (employeeId: number) => teamApi.addMember(employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
  });
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (employeeId: number) => teamApi.removeMember(employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
  });
}

// ---- Admin: All Teams overview ----
export function useAllTeams() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["team", "all-teams"],
    queryFn: () => teamApi.getAllTeams(),
    enabled: user?.userRole === "admin",
    ...sharedQueryOptions,
  });
}

export function useTeamForManager(managerId: number | null) {
  return useQuery({
    queryKey: ["team", "all-teams", managerId],
    queryFn: () => teamApi.getTeamForManager(managerId!),
    enabled: managerId !== null,
    ...sharedQueryOptions,
  });
}

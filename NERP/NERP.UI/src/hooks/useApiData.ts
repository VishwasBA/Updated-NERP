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
  teamApi,
  analyticsApi,
  adminApi,
  notificationsApi,
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

export function useMyRecognitions() {
  return useQuery<ApiRecognition[]>({
    queryKey: ["recognitions", "my"],
    queryFn: recognitionsApi.getMy,
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
    },
  });
}

export function useApproveRecognition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => recognitionsApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recognitions"] });
    },
  });
}

export function useRejectRecognition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => recognitionsApi.reject(id),
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

// ---- Team ----
export function useMyTeam() {
  return useQuery({
    queryKey: ["team", "my"],
    queryFn: teamApi.getMyTeam,
    ...sharedQueryOptions,
  });
}

// ---- Analytics ----
export function useAnalyticsOverview(months = 6) {
  return useQuery({
    queryKey: ["analytics", "overview", months],
    queryFn: () => analyticsApi.getOverview(months),
    ...sharedQueryOptions,
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

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminApi.deleteUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

// ---- Notifications ----
export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: notificationsApi.getAll,
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

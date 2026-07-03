const API_BASE = (import.meta.env.VITE_API_URL || "https://localhost:59587/api").replace(/\/$/, "");

import { getAuthToken, clearAuthToken } from "@/lib/auth";

/**
 * Converts an object of filters into a URL-safe query string.
 */
function buildQueryString(params?: Record<string, string | number | boolean | undefined>): string {
  const query = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Centralized fetch helper for the frontend app.
 * - Applies auth header when available
 * - Sets Content-Type only when a JSON body is being sent
 * - Preserves current 401 behavior (clears token and redirects to /login)
 */
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();

  const headers = new Headers(options.headers ?? {});

  // Only set JSON content type when a body exists and it's not FormData
  if (options.body && !(options.body instanceof FormData)) {
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    // preserve previous UX: clear token and full page redirect to /login
    clearAuthToken();
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || res.statusText || "Request failed");
  }

  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch (err) {
    // If parsing fails, throw a descriptive error
    throw new Error("Invalid JSON response");
  }
}

// ---- Auth ----
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  department: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: ApiCurrentUser;
}

export interface ApiCurrentUser {
  id: number;
  name: string;
  email: string;
  department: string;
  role: string;
  userRole: "employee" | "manager" | "admin";
  totalPoints: number;
  avatar: string;
  location?: string;
}

export const authApi = {
  // Sends login credentials and returns the auth token plus user details.
  login: (data: LoginRequest) =>
    apiFetch<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(data) }),

  // Registers a new user account and returns the authenticated session payload.
  register: (data: RegisterRequest) =>
    apiFetch<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  // Fetches the currently authenticated user's profile information.
  me: () => apiFetch<ApiCurrentUser>("/auth/me"),
};

// ---- Employees ----
export interface ApiEmployee {
  id: number;
  name: string;
  email: string;
  department: string;
  role: string;
  totalPoints: number;
  avatar: string;
}

export const employeesApi = {
  // Loads the full employee list from the API.
  getAll: () => apiFetch<ApiEmployee[]>("/employees"),
};

// ---- Award Categories ----
export interface ApiAwardCategory {
  id: number;
  name: string;
  description: string;
  points: number;
  icon: string;
  managerOnly: boolean;
}

export const categoriesApi = {
  // Retrieves all award categories available for recognition creation.
  getAll: () => apiFetch<ApiAwardCategory[]>("/awardcategories"),
};

// ---- Recognitions ----
export interface ApiRecognition {
  id: number;
  fromEmployeeId: number;
  toEmployeeId: number;
  fromEmployee: ApiEmployee;
  toEmployee: ApiEmployee;
  message: string;
  categoryId?: number;
  category?: ApiAwardCategory;
  points: number;
  createdAt: string;
  type: "appreciation" | "nomination";
  status: "approved" | "pending" | "rejected";
}

export interface ApiLeaderboardEntry {
  id: number;
  name: string;
  avatar: string;
  department: string;
  points: number;
}

export interface ApiDashboardSummary {
  totalRecognitions: number;
  totalPointsAwarded: number;
  uniqueRecognizedEmployees: number;
  activeEmployees: number;
  monthlyPoints: number;
  recognitionsCount: number;
  currentUserRank: number;
  topPerformers: ApiLeaderboardEntry[];
  recentRecognitions: ApiRecognition[];
}

export interface CreateRecognitionRequest {
  toEmployeeId: number;
  message: string;
  categoryId?: number;
  type: string;
  shareToTeams?: boolean;
}

export const recognitionsApi = {
  // Fetches recognitions and appends optional status or type filters to the URL.
  getAll: (params?: { status?: string; type?: string }) =>
    apiFetch<ApiRecognition[]>(`/recognitions${buildQueryString(params)}`),

  // Loads the current user's own recognitions.
  getMy: () => apiFetch<ApiRecognition[]>("/recognitions/my"),

  // Creates a new recognition entry for another employee.
  create: (data: CreateRecognitionRequest) =>
    apiFetch<ApiRecognition>("/recognitions", { method: "POST", body: JSON.stringify(data) }),

  // Approves a pending recognition by its identifier.
  approve: (id: number) => apiFetch<void>(`/recognitions/${id}/approve`, { method: "PUT" }),

  // Rejects a pending recognition by its identifier.
  reject: (id: number) => apiFetch<void>(`/recognitions/${id}/reject`, { method: "PUT" }),
};

// ---- Dashboard ----
export const dashboardApi = {
  getSummary: () => apiFetch<ApiDashboardSummary>("/dashboard"),
};

// ---- Marketplace / Products ----
export interface ApiProduct {
  id: number;
  title: string;
  description?: string;
  image?: string;
  price: number;
  inStock?: boolean;
}

// Allow the marketplace route prefix to be overridden via environment variable
const MARKETPLACE_PREFIX = (import.meta.env.VITE_MARKETPLACE_PREFIX || "/marketplace").replace(/\/$/, "");

export const productsApi = {
  // Retrieves available products in the rewards marketplace.
  getAll: () => apiFetch<ApiProduct[]>(`${MARKETPLACE_PREFIX}/products`),

  // Redeem a product for the current user. Returns a simple success payload.
  // The endpoint URL can be customized via `VITE_MARKETPLACE_PREFIX`.
  redeem: (productId: number) =>
    apiFetch<{ success: boolean; remainingPoints?: number }>(
      `${MARKETPLACE_PREFIX}/redeem`,
      { method: "POST", body: JSON.stringify({ productId }) }
    ),

  // Fetches the current user's past redemptions.
  getHistory: () => apiFetch<ApiRedemption[]>(`${MARKETPLACE_PREFIX}/redeem/history`),
};

// ---- Redemption History ----
export interface ApiRedemption {
  id: number;
  productTitle: string;
  points: number;
  status: string;
  createdAt: string;
}

// ---- Team ----
export interface ApiTeamMember {
  id: number;
  name: string;
  avatar: string;
  role: string;
  department: string;
  appreciationsGiven: number;
  appreciationsReceived: number;
  points: number;
}

export interface ApiTeamSummary {
  teamMembers: number;
  thisMonthAppreciations: number;
  pointsDistributed: number;
  teamRank: number;
  members: ApiTeamMember[];
}

export const teamApi = {
  getMyTeam: () => apiFetch<ApiTeamSummary>("/team"),
};

// ---- Analytics ----
export interface ApiTrendPoint {
  label: string;
  value: number;
}

export interface ApiCategoryCount {
  name: string;
  count: number;
}

export interface ApiDepartmentEngagement {
  department: string;
  recognitions: number;
  employees: number;
  participationRate: number;
}

export interface ApiAnalyticsOverview {
  totalAppreciations: number;
  activeUsers: number;
  pointsIssued: number;
  redemptionRate: number;
  appreciationsOverTime: ApiTrendPoint[];
  topCategories: ApiCategoryCount[];
  departmentEngagement: ApiDepartmentEngagement[];
}

export const analyticsApi = {
  getOverview: (months = 6) => apiFetch<ApiAnalyticsOverview>(`/analytics/overview?months=${months}`),
};

// ---- Admin ----
export interface ApiAdminUser {
  id: number;
  name: string;
  email: string;
  userRole: string;
  department: string;
  isActive: boolean;
}

export const adminApi = {
  getUsers: (params?: { role?: string; department?: string }) =>
    apiFetch<ApiAdminUser[]>(`/admin/users${buildQueryString(params)}`),

  updateRole: (id: number, userRole: string) =>
    apiFetch<{ success: boolean }>(`/admin/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ userRole }),
    }),

  updateStatus: (id: number, isActive: boolean) =>
    apiFetch<{ success: boolean }>(`/admin/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    }),

  deleteUser: (id: number) =>
    apiFetch<{ success: boolean }>(`/admin/users/${id}`, { method: "DELETE" }),
};

// ---- Notifications ----
export interface ApiNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationsApi = {
  getAll: () => apiFetch<ApiNotification[]>("/notifications"),
  markRead: (id: number) => apiFetch<{ success: boolean }>(`/notifications/${id}/read`, { method: "POST" }),
  markAllRead: () => apiFetch<{ success: boolean; count: number }>("/notifications/read-all", { method: "POST" }),
};

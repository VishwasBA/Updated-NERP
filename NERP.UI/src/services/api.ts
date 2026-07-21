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
    // The backend returns errors as JSON, e.g. { message: "..." } from
    // BadRequest(new { message }), or ASP.NET's own { title, errors }
    // shape for model-validation failures. Every call site does
    // `err instanceof Error ? err.message : "..."` to show this in a
    // toast, so surfacing the raw JSON text here (the previous behavior)
    // meant every error toast in the app displayed something like
    // `{"message":"This employee already reports to a manager."}`
    // instead of the actual sentence. Parse it once, here, so all of
    // those call sites just work.
    let friendlyMessage = text || res.statusText || "Request failed";
    if (text) {
      try {
        const parsed = JSON.parse(text);
        if (typeof parsed === "string") {
          friendlyMessage = parsed;
        } else if (parsed && typeof parsed === "object") {
          if (typeof parsed.message === "string") {
            friendlyMessage = parsed.message;
          } else if (typeof parsed.title === "string") {
            // ASP.NET ProblemDetails / validation error shape.
            const firstFieldError = parsed.errors
              ? Object.values(parsed.errors).flat().find((e): e is string => typeof e === "string")
              : undefined;
            friendlyMessage = firstFieldError ?? parsed.title;
          }
        }
      } catch {
        // Not JSON — fall back to the raw text as-is.
      }
    }
    throw new Error(friendlyMessage);
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
  userRole?: string;
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
  userRole: "employee" | "manager" | "admin" | "cu_manager" | "bu_manager";

  totalPoints: number;
  avatar: string;
  location?: string;
  birthDate?: string;
  joiningDate?: string;
}

export interface UpdateProfileRequest {
  name: string;
  department: string;
  location: string;
  birthDate?: string;
  joiningDate?: string;
  avatar?: string;
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

  // Updates the currently authenticated user's profile settings.
  updateProfile: (data: UpdateProfileRequest) =>
    apiFetch<ApiCurrentUser>("/auth/profile", { method: "PUT", body: JSON.stringify(data) }),
};

// ---- Employees ----
export interface ApiEmployee {
  id: number;
  name: string;
  email: string;
  department: string;
  role: string;
  totalPoints: number;
  avatar?: string;
  nominationCount?: number;
  location?: string;
  userRole?: string;
  managerId?: number | null;
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
export interface ApiNominationAudit {
  id: number;
  action: string;
  performedBy: string;
  role: string;
  comments: string;
  createdDate: string;
}

export interface ApiRecognition {
  id: number;
  fromEmployeeId: number;
  toEmployeeId: number;
  fromEmployee: {
    id: number;
    name: string;
    department?: string;
    location?: string;
    avatar?: string;
  };
  toEmployee: {
    id: number;
    name: string;
    department?: string;
    location?: string;
    avatar?: string;
  };
  message: string;
  categoryId?: number | null;
  category?: {
    id: number;
    name: string;
    icon: string;
    awardType?: string;
  };

  points: number;
  createdAt: string;
  type: "appreciation" | "nomination";
  status: string;
  customCategory?: string;
  awardCycle?: string;
  buManagerId?: number;
  buDecisionDate?: string;
  hrAdminId?: number;
  hrDecisionDate?: string;
  audits?: ApiNominationAudit[];
  likeCount?: number;
  commentCount?: number;
  likedByMe?: boolean;
}

export interface ApiLeaderboardEntry {
  id: number;
  name: string;
  avatar?: string;
  department: string;
  role?: string;
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
  appreciationsOverTime: { label: string; value: number }[];
  topCategories: { name: string; count: number }[];
}

export interface CreateRecognitionRequest {
  toEmployeeId: number;
  message: string;
  categoryId?: number | null;
  type: string;
  shareToTeams?: boolean;
  customCategory?: string;
  awardCycle?: string;
}

export const recognitionsApi = {
  // Fetches recognitions and appends optional status or type filters to the URL.
  getAll: (params?: { status?: string; type?: string; page?: number; pageSize?: number }) =>
    apiFetch<ApiRecognition[]>(`/recognitions${buildQueryString(params)}`),

  // Fetches the latest 4 approved nominations.
  getRecentApprovedNominations: () =>
    apiFetch<ApiRecognition[]>("/recognitions/recent-approved-nominations"),

  // Loads the current user's own recognitions.
  getMy: (params?: { page?: number; pageSize?: number; direction?: string; status?: string; type?: string }) =>
    apiFetch<ApiRecognition[]>(`/recognitions/my${buildQueryString(params)}`),

  // Creates a new recognition entry for another employee.
  create: (data: CreateRecognitionRequest) =>
    apiFetch<ApiRecognition>("/recognitions", { method: "POST", body: JSON.stringify(data) }),

  // Get pending nominations for approval (manager/admin)
  getPendingApprovals: () =>
    apiFetch<ApiRecognition[]>("/recognitions/pending-approvals"),

  // BU Manager decision
  buDecision: (id: number, decision: "approve" | "reject" | "shortlist", comments?: string) =>
    apiFetch<void>(`/recognitions/${id}/bu-decision`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, comments }),
    }),

  // HR/Admin decision
  hrDecision: (id: number, decision: "select" | "reject", comments?: string) =>
    apiFetch<void>(`/recognitions/${id}/hr-decision`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, comments }),
    }),

  // Approves a pending recognition by its identifier.
  approve: (id: number) => apiFetch<void>(`/recognitions/${id}/approve`, { method: "PUT" }),

  // Rejects a pending recognition by its identifier.
  reject: (id: number) => apiFetch<void>(`/recognitions/${id}/reject`, { method: "PUT" }),

  // Toggles the current user's like on a recognition card.
  toggleLike: (id: number) =>
    apiFetch<{ likeCount: number; likedByMe: boolean }>(`/recognitions/${id}/like`, { method: "POST" }),

  getComments: (id: number) => apiFetch<ApiRecognitionComment[]>(`/recognitions/${id}/comments`),

  addComment: (id: number, message: string) =>
    apiFetch<ApiRecognitionComment>(`/recognitions/${id}/comments`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),

  editComment: (commentId: number, message: string) =>
    apiFetch<ApiRecognitionComment>(`/recognitions/comments/${commentId}`, {
      method: "PUT",
      body: JSON.stringify({ message }),
    }),

  deleteComment: (commentId: number) =>
    apiFetch<void>(`/recognitions/comments/${commentId}`, {
      method: "DELETE",
    }),

  bulkAppreciate: (recipientIds: number[], categoryId: number | null, message: string) =>
    apiFetch<{ message: string }>("/recognitions/bulk-appreciate", {
      method: "POST",
      body: JSON.stringify({ recipientIds, categoryId, message }),
    }),
};

export interface ApiRecognitionComment {
  id: number;
  recognitionId: number;
  message: string;
  createdAt: string;
  employee: { id: number; name: string; department?: string; location?: string; avatar?: string };
}

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

// ---- Admin ----
export interface ApiAdminUser {
  id: number;
  name: string;
  email: string;
  userRole: string;
  department: string;
  isActive: boolean;
  managerId?: number | null;
  managerName?: string | null;
}

export interface ApiManagerOption {
  id: number;
  name: string;
  department: string;
}

export const adminApi = {
  getUsers: (params?: { role?: string; department?: string }) =>
    apiFetch<ApiAdminUser[]>(`/admin/users${buildQueryString(params)}`),

  getManagerOptions: () => apiFetch<ApiManagerOption[]>("/admin/managers"),

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

  updateManager: (id: number, managerId: number | null) =>
    apiFetch<{ success: boolean }>(`/admin/users/${id}/manager`, {
      method: "PATCH",
      body: JSON.stringify({ managerId }),
    }),

  deleteUser: (id: number) =>
    apiFetch<{ success: boolean }>(`/admin/users/${id}`, { method: "DELETE" }),

  triggerMilestones: () =>
    apiFetch<{ success: boolean; message: string }>("/admin/trigger-milestones", { method: "POST" }),
};

// ---- Team / Manager Dashboard ----
export interface ApiTeamMember {
  id: number;
  name: string;
  role: string;
  department: string;
  avatar: string;
  appreciationsGiven: number;
  appreciationsReceived: number;
  points: number;
  recognitionCount: number;
  awardsCount: number;
  managerId?: number | null;
  reports?: ApiTeamMember[];
}



export interface ApiEmployeeWithoutRecognition {
  id: number;
  name: string;
  department: string;
  avatar: string;
  daysSinceLastAppreciation: number | null;
  currentPoints: number;
}

export interface ApiManagerDashboard {
  stats: {
    totalTeamMembers: number;
    appreciatedEmployees: number;
    employeesWithoutRecognition: number;
    pendingNominations: number;
    totalTeamPoints: number;
  };
  recentAppreciations: ApiRecognition[];
  employeesWithoutRecognition: ApiEmployeeWithoutRecognition[];
  topPerformers: ApiTeamMember[];
  bottomPerformers: ApiTeamMember[];
  members: ApiTeamMember[];
}

export const teamApi = {
  getDashboard: () => apiFetch<ApiManagerDashboard>("/team/dashboard"),
  getAvailableEmployees: (search?: string) =>
    apiFetch<ApiTeamMember[]>(`/team/available-employees${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  addMember: (employeeId: number) =>
    apiFetch<{ success: boolean }>(`/team/members/${employeeId}`, { method: "POST" }),
  removeMember: (employeeId: number) =>
    apiFetch<{ success: boolean }>(`/team/members/${employeeId}`, { method: "DELETE" }),
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

// Org-wide milestone (birthday / work anniversary) feed item, from the
// new additive GET /api/notifications/milestones/feed endpoint. Powers
// the Wall of Fame "Milestones" tab.
export interface ApiMilestoneFeedItem {
  id: number;
  employeeId: number;
  employeeName: string;
  department: string;
  location: string;
  avatar: string;
  title: string;
  message: string;
  type: "birthday" | "anniversary";
  createdAt: string;
}

export const notificationsApi = {
  getAll: () => apiFetch<ApiNotification[]>("/notifications"),
  markRead: (id: number) => apiFetch<{ success: boolean }>(`/notifications/${id}/read`, { method: "POST" }),
  markAllRead: () => apiFetch<{ success: boolean; count: number }>("/notifications/read-all", { method: "POST" }),
  getMilestonesFeed: (type?: "birthday" | "anniversary") =>
    apiFetch<ApiMilestoneFeedItem[]>(`/notifications/milestones/feed${type ? `?type=${type}` : ""}`),
};

// ---- Personal Milestones (achievement page) ----
export interface ApiMilestone {
  key: string;
  title: string;
  description: string;
  icon: string;
  category: "date" | "points" | "appreciations" | "award";
  earned: boolean;
  earnedDate: string | null;
  progressPercent: number;
  progressLabel: string;
}

export const milestonesApi = {
  getMine: () => apiFetch<ApiMilestone[]>("/milestones/me"),
};

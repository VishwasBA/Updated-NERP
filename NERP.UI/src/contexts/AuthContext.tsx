import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import { authApi, ApiCurrentUser } from "@/services/api";
import { getAuthToken, setAuthToken, clearAuthToken } from "@/lib/auth";

interface AuthContextType {
  user: ApiCurrentUser | null;
  loading: boolean;
  login: (token: string, user: ApiCurrentUser) => void;
  logout: () => void;
  updatePoints?: (delta: number) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiCurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const token = getAuthToken();

    if (!token) {
      if (isMounted) setLoading(false);
      return () => {
        isMounted = false;
      };
    }

    authApi
      .me()
      .then((userData) => {
        if (isMounted) setUser(userData);
      })
      .catch(() => {
        if (isMounted) {
          clearAuthToken();
          setUser(null);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback((token: string, userData: ApiCurrentUser) => {
    setAuthToken(token);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    setUser(null);
  }, []);

  const updatePoints = useCallback((delta: number) => {
    setUser((prev) => {
      if (!prev) return prev;
      return { ...prev, totalPoints: (prev.totalPoints || 0) + delta };
    });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authApi.me();
      setUser(userData);
    } catch (err) {
      console.error("Failed to refresh user profile:", err);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, updatePoints, refreshUser }),
    [user, loading, login, logout, updatePoints, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

// Gate a route to specific userRole values (e.g. Manager Dashboard is
// manager/admin only). Renders nothing extra for unauthenticated users —
// ProtectedRoute above already handles that — this only adds the role
// check on top, redirecting anyone without permission back to the home
// dashboard instead of showing a broken/empty page.
export function RoleRoute({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || !roles.includes(user.userRole)) return <Navigate to="/" replace />;

  return <>{children}</>;
}

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({
  role,
  children,
}: {
  role?: "admin" | "user";
  children?: JSX.Element;
}) {
  const { authed, user } = useAuth();
  if (!authed) return <Navigate to="/login" replace />;
  if (user?.firstLogin && location.pathname !== "/reset")
    return <Navigate to="/reset" replace />;
  if (role && user?.role !== role) return <Navigate to="/" replace />;
  return children ?? <Outlet />;
}

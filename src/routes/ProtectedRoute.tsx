import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth }          from "@/context/AuthContext";

export default function ProtectedRoute({
  role,
  children,
}: {
  role?: "admin" | "user";
  children?: ReactNode;
}) {
  const { authed, user } = useAuth();
  if (!authed) return <Navigate to="/login" replace />;
  if (role && !user?.roles?.includes(role)) return <Navigate to="/" replace />;
  return children ?? <Outlet />;
}

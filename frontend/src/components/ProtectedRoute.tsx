import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import type { Role } from "../types";

interface Props {
  children: JSX.Element;
  requireRole?: Role | Role[];
}

export default function ProtectedRoute({ children, requireRole }: Props) {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <p style={{ padding: "2rem" }}>Loading…</p>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (requireRole) {
    const allowed = Array.isArray(requireRole) ? requireRole : [requireRole];
    if (!allowed.includes(user.role)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

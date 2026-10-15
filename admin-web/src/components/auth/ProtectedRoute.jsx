
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/authContext.jsx";

export default function ProtectedRoute({
  allowedRoles = [],
  children,
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(user.role)
  ) {
    return <Navigate to="/login" replace />;
  }

  return children ?? <Outlet />;
}

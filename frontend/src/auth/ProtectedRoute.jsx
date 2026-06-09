// =============================================================================
// auth/ProtectedRoute.jsx — route guard
// -----------------------------------------------------------------------------
// Wraps protected pages. If there is no authenticated user in localStorage,
// it redirects to /login. Otherwise it renders the nested route via <Outlet/>.
// =============================================================================

import { Navigate, Outlet } from "react-router-dom";
import { getCurrentUser } from "./auth";

export default function ProtectedRoute() {
  const user = getCurrentUser();

  // Not logged in -> bounce to the login page. `replace` avoids polluting
  // browser history with the protected URL.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

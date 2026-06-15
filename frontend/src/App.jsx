// =============================================================================
// App.jsx — route table
// -----------------------------------------------------------------------------
// Public routes:    /login, /register
// Protected routes: /users/:username/* (guarded by <ProtectedRoute>, rendered
//                   inside <AppLayout>) with nested posts/todos placeholders.
//
// `/` redirects into the app if logged in, else to /login. Unknown URLs fall
// back to the same smart redirect.
// =============================================================================

import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import AppLayout from "./layouts/AppLayout";
import ProtectedRoute from "./auth/ProtectedRoute";
import Posts from "./pages/protected/Posts";
import Todos from "./pages/protected/Todos";
import Albums from "./pages/protected/Albums";
import Account from "./pages/protected/Account";
import Admin from "./pages/protected/Admin";
import { getCurrentUser } from "./auth/auth";

// Decide where "/" should send the visitor.
function RootRedirect() {
  const user = getCurrentUser();
  return user ? (
    <Navigate to={`/users/${user.username}/posts`} replace />
  ) : (
    <Navigate to="/login" replace />
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected: /users/:username/* */}
      <Route element={<ProtectedRoute />}>
        <Route path="/users/:username" element={<AppLayout />}>
          {/* default child -> posts */}
          <Route index element={<Navigate to="posts" replace />} />
          <Route path="posts" element={<Posts />} />
          <Route path="todos" element={<Todos />} />
          <Route path="albums" element={<Albums />} />
          <Route path="account" element={<Account />} />
          <Route path="admin" element={<Admin />} />
        </Route>
      </Route>

      {/* Root + catch-all */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

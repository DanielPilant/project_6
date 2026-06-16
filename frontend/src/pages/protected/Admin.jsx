// =============================================================================
// pages/protected/Admin.jsx — admin dashboard (advanced stage)
// -----------------------------------------------------------------------------
// Visible only to admins. Loads the WHOLE database in one call and lets the
// admin manage users (promote/demote, block/unblock) and edit/delete any
// content. The super admin is protected (no role/block buttons).
//
//   GET    /admin/data?admin_id=
//   PUT    /admin/users/:id/role     { admin_id, is_admin }
//   PUT    /admin/users/:id/block    { admin_id, blocked }
//   PUT    /admin/:resource/:id      { admin_id, ...fields }
//   DELETE /admin/:resource/:id?admin_id=
// =============================================================================

import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../../api/client";
import { getCurrentUser } from "../../auth/auth";
import AdminUsersTable from "../../components/AdminUsersTable";
import AdminSection from "../../components/AdminSection";
import { SECTIONS } from "../../components/adminSections";

export default function Admin() {
  const admin = getCurrentUser();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      const { data } = await api.get("/admin/data", {
        params: { admin_id: admin.id },
      });
      setData(data);
    } catch (error) {
      setError(`Failed to load admin data: ${error.response?.data?.message || error.message}`);
    }
  }

  // Only an admin loads the data (hooks must run unconditionally, so the guard
  // is inside the effect and the early return below comes AFTER all hooks).
  useEffect(() => {
    if (admin?.is_admin) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Defensive guard: non-admins never get the nav link, but if someone types
  // the URL, bounce them out.
  if (!admin?.is_admin) {
    return <Navigate to={`/users/${admin?.username}/posts`} replace />;
  }

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">Loading…</p>;

  return (
    <div className="placeholder admin">
      <h2>Admin dashboard</h2>

      <AdminUsersTable users={data.users} adminId={admin.id} onChanged={loadData} />

      {SECTIONS.map((section) => (
        <AdminSection
          key={section.resource}
          {...section}
          items={data[section.resource]}
          adminId={admin.id}
          onChanged={loadData}
        />
      ))}
    </div>
  );
}

// =============================================================================
// components/AdminSection.jsx
// -----------------------------------------------------------------------------
// Generic content section: a table with inline edit (editable columns) + delete.
// =============================================================================

import { useState } from "react";
import api from "../api/client";

export default function AdminSection({ resource, title, columns, items, adminId, onChanged }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const [error, setError] = useState("");

  const editableKeys = columns.filter((c) => c.editable).map((c) => c.key);

  function startEdit(item) {
    setEditingId(item.id);
    const d = {};
    editableKeys.forEach((k) => (d[k] = item[k]));
    setDraft(d);
  }

  async function save(id) {
    try {
      await api.put(`/admin/${resource}/${id}`, { admin_id: adminId, ...draft });
      setEditingId(null);
      onChanged();
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    }
  }

  async function remove(id) {
    try {
      await api.delete(`/admin/${resource}/${id}`, { params: { admin_id: adminId } });
      onChanged();
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    }
  }

  return (
    <section className="post-card">
      <h3>{title} ({items.length})</h3>
      {error && <p className="error">{error}</p>}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              {columns.map((c) => <th key={c.key}>{c.label}</th>)}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                {columns.map((c) => (
                  <td key={c.key}>
                    {editingId === item.id && c.editable ? (
                      <input
                        value={draft[c.key] ?? ""}
                        onChange={(e) => setDraft({ ...draft, [c.key]: e.target.value })}
                      />
                    ) : (
                      String(item[c.key] ?? "")
                    )}
                  </td>
                ))}
                <td>
                  <span className="row">
                    {editingId === item.id ? (
                      <>
                        <button onClick={() => save(item.id)}>Save</button>
                        <button onClick={() => setEditingId(null)}>Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => startEdit(item)}>Edit</button>
                    )}
                    <button className="danger" onClick={() => remove(item.id)}>Delete</button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

import { useEffect, useState } from "react";
import api from "../../api/client";
import { getCurrentUser } from "../../auth/auth";

export default function Todos() {
  const user = getCurrentUser(); // logged-in user (has .id and .username)
  const [todos, setTodos] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState("");

  // Which todo is currently being edited, and the text in the edit box.
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  // --- GET: load this user's todos (backend already sorts them by id) -------
  async function loadTodos() {
    try {
      const { data } = await api.get(`/users/${user.id}/todos`);
      setTodos(data);
    } catch (error) {
      setError(
        `Failed to load todos: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  // Run once when the page opens.
  useEffect(() => {
    loadTodos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- POST: add a new todo -------------------------------------------------
  async function addTodo(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const { data } = await api.post("/todos", {
        user_id: user.id,
        title: newTitle.trim(),
        completed: false,
      });
      setTodos([...todos, data]); // add the returned row to the list
      setNewTitle("");
    } catch (error) {
      setError(
        `Failed to add todo: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  // --- PUT (completion state): flip the completed flag ----------------------
  // MySQL returns completed as 0/1, so `!todo.completed` toggles it correctly.
  async function toggleTodo(todo) {
    try {
      const { data } = await api.put(`/todos/${todo.id}`, {
        user_id: todo.user_id,
        title: todo.title,
        completed: !todo.completed,
      });
      setTodos(todos.map((t) => (t.id === todo.id ? data : t)));
    } catch (error) {
      setError(
        `Failed to update todo: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  // --- PUT (content): save an edited title ----------------------------------
  function startEdit(todo) {
    setEditingId(todo.id);
    setEditText(todo.title);
  }
  function cancelEdit() {
    setEditingId(null);
    setEditText("");
  }
  async function saveEdit(todo) {
    if (!editText.trim()) return;
    try {
      const { data } = await api.put(`/todos/${todo.id}`, {
        user_id: todo.user_id,
        title: editText.trim(),
        completed: todo.completed,
      });
      setTodos(todos.map((t) => (t.id === todo.id ? data : t)));
      cancelEdit();
    } catch (error) {
      setError(
        `Failed to update todo: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  // --- DELETE: remove a todo ------------------------------------------------
  async function deleteTodo(id) {
    try {
      await api.delete(`/todos/${id}`);
      setTodos(todos.filter((t) => t.id !== id));
    } catch (error) {
      setError(
        `Failed to delete todo: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  return (
    <div className="placeholder">
      <h2>Todos</h2>

      {/* Add form (POST) */}
      <form onSubmit={addTodo} style={{ flexDirection: "row", gap: "0.5rem" }}>
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New todo title..."
        />
        <button type="submit">Add</button>
      </form>

      {error && <p className="error">{error}</p>}

      {/* List, sorted by id (as the backend returns it) */}
      <ul className="todo-list">
        {todos.map((todo) => (
          <li key={todo.id} className="todo-item">
            {/* checkbox = PUT on completion state */}
            <input
              type="checkbox"
              checked={!!todo.completed}
              onChange={() => toggleTodo(todo)}
            />

            {editingId === todo.id ? (
              // Edit mode: change the title, then Save (PUT) or Cancel.
              <>
                <input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  autoFocus
                />
                <button onClick={() => saveEdit(todo)}>Save</button>
                <button onClick={cancelEdit}>Cancel</button>
              </>
            ) : (
              // View mode: show the title with Edit + Delete actions.
              <>
                <span className={todo.completed ? "todo-done" : ""}>
                  {todo.title}
                </span>
                <button onClick={() => startEdit(todo)}>Edit</button>
                <button className="danger" onClick={() => deleteTodo(todo.id)}>
                  Delete
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      {todos.length === 0 && <p className="muted">No todos yet.</p>}
    </div>
  );
}

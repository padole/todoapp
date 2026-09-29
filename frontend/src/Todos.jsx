import { useEffect, useState } from "react";
import { api } from "./api.js";

export default function Todos() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [dragId, setDragId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const [filter, setFilter] = useState("all"); // all | pending | completed

  // Run an action; show a message if the backend can't be reached.
  async function run(action) {
    try {
      setError("");
      await action();
    } catch {
      setError("Can't reach the server. Make sure the backend is running on port 8000.");
    }
  }

  useEffect(() => {
    run(async () => setTodos(await api("/todos")));
  }, []);

  const add = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    run(async () => {
      const todo = await api("/todos", "POST", { text });
      setTodos((list) => [...list, todo]);
      setText("");
    });
  };

  const toggle = (todo) =>
    run(async () => {
      const updated = await api(`/todos/${todo.id}`, "PATCH", { done: !todo.done });
      setTodos((list) => list.map((t) => (t.id === todo.id ? updated : t)));
    });

  const remove = (id) =>
    run(async () => {
      await api(`/todos/${id}`, "DELETE");
      setTodos((list) => list.filter((t) => t.id !== id));
    });

  const saveEdit = (id) => {
    const value = editText.trim();
    setEditId(null);
    if (!value) return;
    run(async () => {
      const updated = await api(`/todos/${id}`, "PATCH", { text: value });
      setTodos((list) => list.map((t) => (t.id === id ? updated : t)));
    });
  };

  // Drag and drop: reorder on screen while dragging, save when you let go.
  const dragOver = (e, overId) => {
    e.preventDefault();
    if (dragId === null || dragId === overId) return;
    setTodos((list) => {
      const next = [...list];
      const from = next.findIndex((t) => t.id === dragId);
      const to = next.findIndex((t) => t.id === overId);
      next.splice(to, 0, next.splice(from, 1)[0]);
      return next;
    });
  };

  const dragEnd = () => {
    setDragId(null);
    run(() => api("/todos/order", "PUT", { ids: todos.map((t) => t.id) }));
  };

  const remaining = todos.filter((t) => !t.done).length;
  const visible = todos.filter(
    (t) => filter === "all" || (filter === "completed" ? t.done : !t.done)
  );

  return (
    <main className="page">
      <h1>Todo list</h1>
      <p className="count">
        {todos.length === 0 ? "Nothing to do yet." : `${remaining} of ${todos.length} left to do`}
      </p>

      <form className="add" onSubmit={add}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What needs doing?"
          aria-label="New item"
        />
        <button type="submit">Add item</button>
      </form>

      {error && <p className="error" role="alert">{error}</p>}

      <div className="filter">
        <label htmlFor="filter">Show</label>
        <select id="filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <ul className="list">
        {visible.map((todo) => (
          <li
            key={todo.id}
            className={`item${todo.done ? " done" : ""}${dragId === todo.id ? " dragging" : ""}`}
            draggable={editId !== todo.id}
            onDragStart={() => setDragId(todo.id)}
            onDragOver={(e) => dragOver(e, todo.id)}
            onDragEnd={dragEnd}
          >
            <span className="grip" aria-hidden="true" title="Drag to reorder">⠿</span>
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => toggle(todo)}
              aria-label={`Mark "${todo.text}" as done`}
            />
            {editId === todo.id ? (
              <input
                className="edit"
                autoFocus
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={() => saveEdit(todo.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit(todo.id);
                  if (e.key === "Escape") setEditId(null);
                }}
                aria-label="Edit item"
              />
            ) : (
              <span className="text">{todo.text}</span>
            )}
            <button
              className="link"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { setEditId(todo.id); setEditText(todo.text); }}
            >
              Edit
            </button>
            <button className="link danger" onClick={() => remove(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
      {todos.length > 0 && visible.length === 0 && (
        <p className="hint">No {filter} items.</p>
      )}
      {visible.length > 1 && <p className="hint">Drag the dots to reorder.</p>}
    </main>
  );
}

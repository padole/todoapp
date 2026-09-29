import { useEffect, useState } from "react";
import { api } from "./api.js";

// SQLite stores UTC time as "YYYY-MM-DD HH:MM:SS"; show it in the viewer's local time.
const when = (s) =>
  new Date(s.replace(" ", "T") + "Z").toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");

  async function run(action) {
    try {
      setError("");
      await action();
    } catch {
      setError("Can't reach the server. Make sure the backend is running on port 8000.");
    }
  }

  useEffect(() => {
    run(async () => setNotes(await api("/notes")));
  }, []);

  const add = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    run(async () => {
      const note = await api("/notes", "POST", { text });
      setNotes((list) => [note, ...list]);
      setText("");
    });
  };

  const save = (id) => {
    const value = editText.trim();
    setEditId(null);
    if (!value) return;
    run(async () => {
      const updated = await api(`/notes/${id}`, "PATCH", { text: value });
      setNotes((list) => list.map((n) => (n.id === id ? updated : n)));
    });
  };

  const remove = (id) =>
    run(async () => {
      await api(`/notes/${id}`, "DELETE");
      setNotes((list) => list.filter((n) => n.id !== id));
    });

  return (
    <main className="page">
      <h1>Notes</h1>
      <p className="count">{notes.length === 0 ? "No notes yet." : `${notes.length} saved`}</p>

      <form className="note-form" onSubmit={add}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a note..."
          rows={4}
          aria-label="New note"
        />
        <button type="submit">Save note</button>
      </form>

      {error && <p className="error" role="alert">{error}</p>}

      {notes.map((n) => (
        <article className="card" key={n.id}>
          {editId === n.id ? (
            <>
              <textarea
                autoFocus
                rows={4}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                aria-label="Edit note"
              />
              <div className="meta">
                <span className="when" />
                <button className="link" onClick={() => setEditId(null)}>Cancel</button>
                <button className="link" onClick={() => save(n.id)}>Save</button>
              </div>
            </>
          ) : (
            <>
              <p className="nbody">{n.text}</p>
              <div className="meta">
                <span className="when">{when(n.created_at)}</span>
                <button className="link" onClick={() => { setEditId(n.id); setEditText(n.text); }}>Edit</button>
                <button className="link danger" onClick={() => remove(n.id)}>Delete</button>
              </div>
            </>
          )}
        </article>
      ))}
    </main>
  );
}

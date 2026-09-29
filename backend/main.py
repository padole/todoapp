import sqlite3
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

DB_PATH = Path(__file__).parent / "todos.db"  # created automatically on first run

app = FastAPI(title="Todo API")


def connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


with connect() as conn:
    conn.execute(
        """CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL,
            done INTEGER NOT NULL DEFAULT 0,
            position INTEGER NOT NULL
        )"""
    )
    conn.execute(
        """CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )"""
    )


class NewTodo(BaseModel):
    text: str


class TodoUpdate(BaseModel):
    text: Optional[str] = None
    done: Optional[bool] = None


class Order(BaseModel):
    ids: List[int]


def to_dict(row):
    return {"id": row["id"], "text": row["text"], "done": bool(row["done"])}


@app.get("/api/todos")
def list_todos():
    with connect() as conn:
        rows = conn.execute("SELECT * FROM todos ORDER BY position").fetchall()
    return [to_dict(r) for r in rows]


@app.post("/api/todos", status_code=201)
def add_todo(body: NewTodo):
    text = body.text.strip()
    if not text:
        raise HTTPException(400, "Text cannot be empty")
    with connect() as conn:
        pos = conn.execute("SELECT COALESCE(MAX(position), 0) + 1 FROM todos").fetchone()[0]
        cur = conn.execute("INSERT INTO todos (text, position) VALUES (?, ?)", (text, pos))
        row = conn.execute("SELECT * FROM todos WHERE id = ?", (cur.lastrowid,)).fetchone()
    return to_dict(row)


@app.put("/api/todos/order")
def reorder(body: Order):
    with connect() as conn:
        for position, todo_id in enumerate(body.ids, start=1):
            conn.execute("UPDATE todos SET position = ? WHERE id = ?", (position, todo_id))
    return {"ok": True}


@app.patch("/api/todos/{todo_id}")
def update_todo(todo_id: int, body: TodoUpdate):
    with connect() as conn:
        row = conn.execute("SELECT * FROM todos WHERE id = ?", (todo_id,)).fetchone()
        if row is None:
            raise HTTPException(404, "Todo not found")
        text = row["text"] if body.text is None else body.text.strip()
        if not text:
            raise HTTPException(400, "Text cannot be empty")
        done = row["done"] if body.done is None else int(body.done)
        conn.execute("UPDATE todos SET text = ?, done = ? WHERE id = ?", (text, done, todo_id))
        row = conn.execute("SELECT * FROM todos WHERE id = ?", (todo_id,)).fetchone()
    return to_dict(row)


@app.delete("/api/todos/{todo_id}", status_code=204)
def delete_todo(todo_id: int):
    with connect() as conn:
        conn.execute("DELETE FROM todos WHERE id = ?", (todo_id,))


# ---------- Notes ----------
class NoteIn(BaseModel):
    text: str


def note_dict(row):
    return {"id": row["id"], "text": row["text"], "created_at": row["created_at"]}


def clean(text: str) -> str:
    text = text.strip()
    if not text:
        raise HTTPException(400, "Note cannot be empty")
    return text


@app.get("/api/notes")
def list_notes():
    with connect() as conn:
        rows = conn.execute("SELECT * FROM notes ORDER BY id DESC").fetchall()
    return [note_dict(r) for r in rows]


@app.post("/api/notes", status_code=201)
def add_note(body: NoteIn):
    text = clean(body.text)
    with connect() as conn:
        cur = conn.execute("INSERT INTO notes (text) VALUES (?)", (text,))
        row = conn.execute("SELECT * FROM notes WHERE id = ?", (cur.lastrowid,)).fetchone()
    return note_dict(row)


@app.patch("/api/notes/{note_id}")
def update_note(note_id: int, body: NoteIn):
    text = clean(body.text)
    with connect() as conn:
        cur = conn.execute("UPDATE notes SET text = ? WHERE id = ?", (text, note_id))
        if cur.rowcount == 0:
            raise HTTPException(404, "Note not found")
        row = conn.execute("SELECT * FROM notes WHERE id = ?", (note_id,)).fetchone()
    return note_dict(row)


@app.delete("/api/notes/{note_id}", status_code=204)
def delete_note(note_id: int):
    with connect() as conn:
        conn.execute("DELETE FROM notes WHERE id = ?", (note_id,))

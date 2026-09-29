# Todo list (FastAPI + React + SQLite)

You need two things installed first:
- Python 3.10 or newer  (check with: python --version)
- Node.js LTS           (check with: node --version)

You will use TWO terminal windows: one for the backend, one for the frontend.

## Terminal 1 - backend
    cd backend
    python -m venv .venv
    source .venv/bin/activate        (Windows: .venv\Scripts\activate)
    pip install -r requirements.txt
    uvicorn main:app --reload

Leave it running. It should say "Uvicorn running on http://127.0.0.1:8000".
The database file (todos.db) is created automatically in backend/.

## Terminal 2 - frontend
    cd frontend
    npm install
    npm run dev

## Open the app
Go to http://localhost:5173 in your browser.
(API docs, generated automatically: http://localhost:8000/docs)

## Using it
- Type in the box and press Enter to add an item.
- Tick the box to check an item off.
- Drag the dots on the left to reorder. The order is saved.
- The Show dropdown filters the list: All, Pending, or Completed.
- Edit changes the text (Enter saves, Esc cancels). Delete removes it.

## Notes tab
- Click "Notes" at the top. Write a note and press Save note (newest first).
- Edit changes a note, Delete removes it. Notes are stored in the same todos.db file.

## Common problems
- "Can't reach the server" in the page: the backend (Terminal 1) is not running.
- "command not found: python": try python3 instead of python.

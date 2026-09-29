import { useState } from "react";
import Todos from "./Todos.jsx";
import Notes from "./Notes.jsx";

const TABS = [["todos", "Todos"], ["notes", "Notes"]];

export default function App() {
  const [tab, setTab] = useState("todos");
  return (
    <>
      <nav className="tabs" role="tablist">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? "tab active" : "tab"}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      {tab === "todos" ? <Todos /> : <Notes />}
    </>
  );
}

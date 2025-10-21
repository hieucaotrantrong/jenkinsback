import React, { useEffect, useState } from "react";

export default function App() {
  const [health, setHealth] = useState<string>("checking...");
  const [items, setItems] = useState<{ id: number, title: string }[]>([]);
  const [title, setTitle] = useState("");

  async function refresh() {
    const h = await fetch("/api/health").then(r => r.json()).catch(() => ({ status: "fail" }));
    setHealth(h.status ?? "fail");
    const it = await fetch("/api/items").then(r => r.json()).catch(() => ({ items: [] }));
    setItems(it.items || []);
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title })
    });
    setTitle("");
    refresh();
  }

  useEffect(() => { refresh(); }, []);

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", fontFamily: "system-ui, sans-serif" }}>
      <h1>React + Vite + FastAPI + Postgres</h1>
      <p>Backend healthhhhhhhh: <b>{health}</b></p>
      <form onSubmit={addItem} style={{ display: "flex", gap: 8 }}>
        <input
          placeholder="New item title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit">Add</button>
      </form>
      <ul>
        {items.map(i => <li key={i.id}>#{i.id}: {i.title}</li>)}
      </ul>
    </div>
  );
}

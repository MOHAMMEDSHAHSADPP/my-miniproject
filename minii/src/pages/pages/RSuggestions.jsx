import { useEffect, useState } from "react";
import API from "../../api";

export default function RSuggestions() {
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("");
  const [text, setText] = useState("");

  const load = async () => {
    setMsg("");
    try {
      const res = await API.get("/resident/suggestions/mine");
      setItems(res.data || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load suggestions");
    }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!text.trim()) return setMsg("Write suggestion first");
    try {
      await API.post("/resident/suggestions", { text });
      setText("");
      load();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Create failed");
    }
  };

  return (
    <div style={{ padding: 14 }}>
      <h2>Suggestions</h2>
      {msg && <p>{msg}</p>}

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input style={{ flex: 1 }} placeholder="Your suggestion..." value={text} onChange={(e) => setText(e.target.value)} />
        <button onClick={create}>Send</button>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {items.map((s) => (
          <div key={s._id} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
            <div>{s.text || s.message}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              {s.status || "pending"} • {s.createdAt ? new Date(s.createdAt).toLocaleString() : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

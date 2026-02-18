import React, { useEffect, useState } from "react";
import API from "../../api";

export default function ResidentChatWard() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const load = async () => {
    const res = await API.get("/resident/chat/ward/messages");
    setMessages(res.data || []);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  const send = async () => {
    if (!text.trim()) return;
    await API.post("/resident/chat/ward/messages", { text });
    setText("");
    load();
  };

  return (
    <div className="card">
      <h2 className="h1">Ward Chat</h2>

      <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
        {messages.map((m) => (
          <div key={m._id} className="card" style={{ padding: 12 }}>
            <b>{m.senderName || "Resident"}</b>
            <div className="muted" style={{ marginTop: 4 }}>{m.text}</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
              {m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <textarea
          placeholder="Type message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid var(--border)" }}
        />
        <button className="btn" style={{ marginTop: 10 }} onClick={send}>
          Send
        </button>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import API from "../../api";

export default function ResidentChatTown() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const load = async () => {
    const res = await API.get("/resident/chat/town/messages");
    setMessages(res.data || []);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  const send = async () => {
    if (!text.trim()) return;
    await API.post("/resident/chat/town/messages", { text });
    setText("");
    load();
  };

  const delForMe = async (id) => {
    await API.delete(`/resident/chat/message/${id}`);
    load();
  };

  const report = async (id) => {
    await API.post(`/resident/chat/message/${id}/report`, { reason: "Reported by user" });
    alert("Reported to admin");
  };

  return (
    <div className="card">
      <h2 className="h1">Town Chat</h2>

      <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
        {messages.map((m) => (
          <div key={m._id} className="card" style={{ padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div>
                <b>{m.senderName || "Resident"}</b>
                <div className="muted" style={{ marginTop: 4 }}>{m.text}</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                  {m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "start" }}>
                <button className="btn2" onClick={() => delForMe(m._id)}>Delete</button>
                <button className="btn2" onClick={() => report(m._id)}>Report</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <textarea
          placeholder="Type message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 10,
            border: "1px solid var(--border)",
          }}
        />
        <button className="btn" style={{ marginTop: 10 }} onClick={send}>
          Send
        </button>
      </div>
    </div>
  );
}

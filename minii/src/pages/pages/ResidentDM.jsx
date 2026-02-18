import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../../api";

export default function ResidentDM() {
  const { otherUserId } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const load = async () => {
    const res = await API.get(`/resident/chat/dm/${otherUserId}`);
    setMessages(res.data || []);
  };

  useEffect(() => {
    load();
  }, [otherUserId]);

  const send = async () => {
    if (!text.trim()) return;
    await API.post(`/resident/chat/dm/${otherUserId}`, { text });
    setText("");
    load();
  };

  return (
    <div className="card">
      <h2 className="h1">Direct Message</h2>
      <p className="muted">User ID: {otherUserId}</p>

      <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
        {messages.map((m) => (
          <div key={m._id} className="card" style={{ padding: 12 }}>
            <b>{m.senderName || "User"}</b>
            <div className="muted" style={{ marginTop: 4 }}>{m.text}</div>
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

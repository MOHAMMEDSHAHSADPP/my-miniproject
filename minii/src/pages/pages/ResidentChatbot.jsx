import React, { useState } from "react";
import API from "../../api";

export default function ResidentChatbot() {
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi 👋 Ask: plumber / electrician / hospital / time / date" },
  ]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!text.trim()) return;

    const my = { from: "me", text };
    setMessages((p) => [...p, my]);
    setText("");

    try {
      setLoading(true);
      const res = await API.post("/resident/chatbot", { message: my.text });
      setMessages((p) => [...p, { from: "bot", text: res.data?.reply || "No reply" }]);
    } catch (e) {
      setMessages((p) => [...p, { from: "bot", text: "Server error" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="h1">Town Assistant</h2>

      <div className="card" style={{ marginTop: 12, minHeight: 300 }}>
        <div style={{ display: "grid", gap: 10 }}>
          {messages.map((m, i) => (
            <div
              key={i}
              className="card"
              style={{
                padding: 10,
                maxWidth: "90%",
                marginLeft: m.from === "me" ? "auto" : 0,
              }}
            >
              <b>{m.from === "me" ? "You" : "Assistant"}</b>
              <div className="muted" style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>
                {m.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type here..."
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 10,
            border: "1px solid var(--border)",
          }}
        />
        <button className="btn2" onClick={send} disabled={loading}>
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}

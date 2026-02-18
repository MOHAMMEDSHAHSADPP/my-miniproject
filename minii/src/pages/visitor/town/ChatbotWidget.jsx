import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../../../api";
import "./town.css";

export default function ChatbotWidget() {
  const { townSlug } = useParams();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [log, setLog] = useState([
    { from: "bot", msg: "Hi! Ask: hotel, hospital, emergency, announcements, time, date." },
  ]);

  const endRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [open, log]);

  const send = async () => {
    const t = text.trim();
    if (!t) return;

    setLog((p) => [...p, { from: "me", msg: t }]);
    setText("");

    try {
      const res = await API.post(`/visitor/${townSlug}/chat`, { message: t });
      setLog((p) => [...p, { from: "bot", msg: res.data.reply || "..." }]);
    } catch {
      setLog((p) => [...p, { from: "bot", msg: "Server error. Try again." }]);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          position: "fixed",
          right: 18,
          bottom: 18,
          zIndex: 60,
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          background: "linear-gradient(90deg, #4f46e5, #7c3aed)",
          color: "#fff",
          boxShadow: "0 18px 45px rgba(15,23,42,0.25)",
          fontSize: 24,
          fontWeight: 900,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-label="Chatbot"
      >
        <i className="ri-customer-service-2-line" />
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            right: 18,
            bottom: 84,
            zIndex: 60,
            width: 360,
            maxWidth: "92vw",
            borderRadius: 18,
            border: "1px solid rgba(15,23,42,0.10)",
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 22px 55px rgba(15,23,42,0.18)",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: 12, fontWeight: 1000, color: "#0f172a", borderBottom: "1px solid rgba(15,23,42,0.08)" }}>
            Help Bot • {townSlug}
          </div>

          <div style={{ padding: 14, height: 320, overflow: "auto", display: "grid", gap: 10 }}>
            {log.map((m, i) => (
              <div
                key={i}
                style={{
                  justifySelf: m.from === "me" ? "end" : "start",
                  maxWidth: "85%",
                  padding: "10px 12px",
                  borderRadius: 14,
                  background: m.from === "me" ? "#0f172a" : "#eef2ff",
                  color: m.from === "me" ? "#fff" : "#0f172a",
                  fontWeight: 800,
                  whiteSpace: "pre-wrap",
                }}
              >
                {m.msg}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div style={{ display: "flex", gap: 10, padding: 14, borderTop: "1px solid rgba(15,23,42,0.08)" }}>
            <input
              className="input"
              style={{ flex: 1, height: "46px", fontSize: "16px" }}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ask something..."
              onKeyDown={(e) => (e.key === "Enter" ? send() : null)}
            />
            <button className="btn" onClick={send} style={{
              background: "linear-gradient(90deg, #4f46e5, #7c3aed)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontWeight: "bold",
              cursor: "pointer",
              padding: "0 24px",
              height: "46px",
              fontSize: "15px"
            }}>
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}

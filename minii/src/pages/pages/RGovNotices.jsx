import React, { useEffect, useState } from "react";
import API from "../../api";

export default function RGovNotices() {
  const [items, setItems] = useState([]);

  const load = async () => {
    const r = await API.get("/resident/gov-notices");
    setItems(r.data || []);
  };

  useEffect(() => { load(); }, []);

  const handleAcknowledge = async (id) => {
    try {
      await API.put(`/resident/gov-notices/${id}/acknowledge`);
      setItems((prev) =>
        prev.map((n) => (n._id === id ? { ...n, acknowledged: true } : n))
      );
      alert("✅ Notice acknowledged!");
    } catch (e) {
      alert("Failed to acknowledge.");
    }
  };

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 16, border: "1px solid rgba(120,80,255,0.15)" }}>
      <h2 style={{ marginTop: 0, color: "#3a2b7a" }}>Government Notices</h2>

      {items.length === 0 ? <p>No notices</p> : (
        <div style={{ display: "grid", gap: 10 }}>
          {items.map((n) => (
            <div key={n._id} style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(120,80,255,0.15)", background: "#faf9ff" }}>
              <b>{n.title || "Notice"}</b>
              <div style={{ color: "#6b5aa6" }}>{n.message}</div>
              <div style={{ fontSize: 12, color: "#7b6bb2" }}>
                Deadline: {n.deadline ? new Date(n.deadline).toLocaleDateString() : "—"}
              </div>
              {n.acknowledged ? (
                <span style={{ display: "inline-block", marginTop: 8, padding: "6px 10px", borderRadius: 12, background: "#e0ffe0", color: "#28a745", fontSize: 14 }}>
                  ✅ Read
                </span>
              ) : (
                <button
                  onClick={() => handleAcknowledge(n._id)}
                  style={{ marginTop: 8, borderRadius: 12, padding: "8px 12px", border: "none", background: "#2a214f", color: "#fff", cursor: "pointer" }}
                >
                  Yes, I have read it
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

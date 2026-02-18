import React, { useEffect, useState } from "react";
import API from "../../api";

export default function RAlerts() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    API.get("/resident/alerts").then((r) => setItems(r.data || [])).catch(() => {});
  }, []);

  return (
    <div style={{ background:"#fff", borderRadius:16, padding:16, border:"1px solid rgba(120,80,255,0.15)" }}>
      <h2 style={{ marginTop:0, color:"#3a2b7a" }}>Town Alerts</h2>

      {items.length === 0 ? <p>No active alerts</p> : (
        <div style={{ display:"grid", gap:10 }}>
          {items.map((a) => (
            <div key={a._id} style={{
              padding:12,
              borderRadius:14,
              border:"1px solid rgba(255,60,60,0.25)",
              background:"rgba(255,240,240,0.9)"
            }}>
              <b>{a.title || "Alert"}</b>
              <div style={{ color:"#6b5aa6" }}>{a.message}</div>
              <div style={{ fontSize:12, color:"#7b6bb2" }}>
                {a.kind || a.type} • {a.priority} • {new Date(a.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

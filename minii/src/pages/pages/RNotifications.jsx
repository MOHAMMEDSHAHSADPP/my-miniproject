import React, { useEffect, useState } from "react";
import API from "../../api";

export default function RNotifications() {
  const [items, setItems] = useState([]);

  const load = async () => {
    const r = await API.get("/resident/notifications");
    setItems(r.data || []);
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await API.put(`/resident/notifications/${id}/read`);
    load();
  };

  const markAll = async () => {
    await API.put("/resident/notifications/read-all");
    load();
  };

  return (
    <div style={{ background:"#fff", borderRadius:16, padding:16, border:"1px solid rgba(120,80,255,0.15)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <h2 style={{ margin:0, color:"#3a2b7a" }}>Notifications</h2>
        <button onClick={markAll} style={{ borderRadius:12, padding:"8px 12px", border:"1px solid rgba(120,80,255,0.25)", background:"#fff", cursor:"pointer" }}>
          Mark all read
        </button>
      </div>

      {items.length === 0 ? <p>No notifications</p> : (
        <div style={{ marginTop:12, display:"grid", gap:10 }}>
          {items.map((n) => (
            <div key={n._id} style={{
              padding:12,
              borderRadius:14,
              border:"1px solid rgba(120,80,255,0.15)",
              background: n.isRead ? "#faf9ff" : "#f0edff"
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", gap:10 }}>
                <div>
                  <b>{n.title || "Notification"}</b>
                  <div style={{ color:"#6b5aa6" }}>{n.message}</div>
                  <div style={{ fontSize:12, color:"#7b6bb2" }}>
                    {n.type} • {n.priority} • {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
                {!n.isRead && (
                  <button onClick={() => markRead(n._id)} style={{ height:34, borderRadius:12, padding:"0 10px", border:"none", background:"#2a214f", color:"#fff", cursor:"pointer" }}>
                    Read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

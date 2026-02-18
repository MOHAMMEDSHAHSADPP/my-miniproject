import { useState } from "react";
import API from "../../../api";

export default function TicketDetailModal({ ticket, onClose, onReload }) {
  const [msg, setMsg] = useState("");
  const [reply, setReply] = useState("");
  const [image, setImage] = useState(null);

  const auth = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const sendReply = async () => {
    setMsg("");
    if (!reply.trim() && !image) return setMsg("Type a reply or choose an image");

    try {
      const fd = new FormData();
      fd.append("message", reply);
      if (image) fd.append("image", image);

      await API.post(`/resident-admin/tickets/${ticket._id}/reply`, fd, {
        headers: { ...auth().headers, "Content-Type": "multipart/form-data" },
      });

      setReply("");
      setImage(null);
      onReload();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Reply failed");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
        padding: 12,
      }}
    >
      <div
        style={{
          width: "min(900px, 96vw)",
          maxHeight: "90vh",
          overflow: "auto",
          background: "#fff",
          borderRadius: 14,
          padding: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <div>
            <h3 style={{ margin: 0 }}>{ticket.subject || "Ticket"}</h3>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              User: {ticket.userName || "-"} • Ward: {ticket.ward || "-"} • Status: {ticket.status}
            </div>
          </div>
          <button className="ad-btn" onClick={onClose}>
            Close
          </button>
        </div>

        {msg && <div className="ad-msg" style={{ marginTop: 10 }}>{msg}</div>}

        <div style={{ marginTop: 14, borderTop: "1px solid #eee", paddingTop: 12 }}>
          {(ticket.messages || []).map((m, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {m.senderRole || "resident"} • {m.at ? new Date(m.at).toLocaleString() : ""}
              </div>
              <div style={{ whiteSpace: "pre-wrap" }}>{m.text || ""}</div>
              {m.image && (
                <img
                  src={m.image}
                  alt="ticket"
                  style={{ marginTop: 6, maxWidth: "100%", borderRadius: 10 }}
                />
              )}
            </div>
          ))}
          {!ticket.messages?.length && (
            <div style={{ opacity: 0.6 }}>No messages yet.</div>
          )}
        </div>

        <div style={{ marginTop: 14, borderTop: "1px solid #eee", paddingTop: 12 }}>
          <h4 style={{ margin: "0 0 8px" }}>Reply</h4>
          <textarea
            rows={3}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type reply..."
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 10,
              border: "1px solid #ddd",
              outline: "none",
            }}
          />
          <div className="ad-row" style={{ marginTop: 8 }}>
            <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} />
            <button className="ad-primary" onClick={sendReply}>
              Send Reply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

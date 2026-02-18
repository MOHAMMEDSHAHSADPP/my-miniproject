import React, { useState, useEffect } from "react";
import API from "../../api";
import "./RServices.css";

export default function RTickets() {
  const [tickets, setTickets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ subject: "", description: "" });
  const [replyMsg, setReplyMsg] = useState("");
  const [activeTicket, setActiveTicket] = useState(null);

  useEffect(() => { load(); }, []);

  const load = () => {
    API.get("/resident/tickets").then(r => {
      setTickets(r.data || []);
      if (activeTicket) {
        const updated = (r.data || []).find(t => t._id === activeTicket._id);
        if (updated) setActiveTicket(updated);
      }
    }).catch(() => { });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/resident/tickets", formData);
      alert("✅ Ticket Created!");
      setShowForm(false);
      setFormData({ subject: "", description: "" });
      load();
    } catch (e) {
      alert("Failed to create ticket.");
    }
  };

  const sendReply = async (ticketId) => {
    if (!replyMsg.trim()) return;
    try {
      await API.post(`/resident/tickets/${ticketId}/reply`, { message: replyMsg });
      setReplyMsg("");
      load();
    } catch (e) {
      console.error(e);
      alert("Reply failed");
    }
  };

  return (
    <div className="rservices-container">
      <div className="rservices-header">
        <h2>🎫 Support Tickets</h2>
        <button className="btn-new" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Close" : "➕ New Ticket"}
        </button>
      </div>

      {showForm && (
        <div className="rservices-form-card">
          <h3>Open a New Ticket</h3>
          <form onSubmit={handleSubmit}>
            <label>Subject</label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Issue summary..."
            />
            <label>Description</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your issue..."
            />
            <button type="submit" className="btn-submit">Submit Ticket</button>
          </form>
        </div>
      )}

      <div className="rservices-list" style={{ display: "grid", gap: 16 }}>
        {tickets.length === 0 ? <p className="empty-msg">No tickets found.</p> : (
          tickets.map((t) => (
            <div key={t._id} className="rservices-card">
              <div className="card-top" onClick={() => setActiveTicket(activeTicket?._id === t._id ? null : t)} style={{ cursor: "pointer" }}>
                <div>
                  <h4 style={{ margin: 0 }}>{t.subject}</h4>
                  <div style={{ fontSize: "0.85rem", color: "#718096" }}>{new Date(t.createdAt).toLocaleDateString()}</div>
                </div>
                <div className={`status-badge ${t.status || 'Open'}`}>{t.status || 'Open'}</div>
              </div>

              {activeTicket?._id === t._id && (
                <div style={{ marginTop: 16, borderTop: "1px solid #e2e8f0", paddingTop: 12 }}>
                  <div style={{ maxHeight: 300, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                    {t.messages && t.messages.map((m, i) => (
                      <div key={i} style={{
                        alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                        background: m.sender === "user" ? "#ebf8ff" : "#f7fafc",
                        padding: "8px 12px", borderRadius: 8,
                        maxWidth: "85%",
                        border: `1px solid ${m.sender === "user" ? "#bee3f8" : "#e2e8f0"}`
                      }}>
                        <div style={{ fontWeight: 600, fontSize: "0.75rem", color: "#4a5568", marginBottom: 2 }}>
                          {m.sender === "user" ? "You" : "Support"} • {new Date(m.createdAt).toLocaleString()}
                        </div>
                        <div>{m.message}</div>
                      </div>
                    ))}
                    {(!t.messages || t.messages.length === 0) && <p>{t.description}</p>}
                  </div>

                  {t.status !== "closed" && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        placeholder="Type a reply..."
                        value={replyMsg}
                        onChange={(e) => setReplyMsg(e.target.value)}
                        style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #cbd5e0" }}
                      />
                      <button onClick={() => sendReply(t._id)} style={{ padding: "8px 16px", background: "#4b34c8", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>Send</button>
                    </div>
                  )}
                </div>
              )}
              {activeTicket?._id !== t._id && <p style={{ margin: "8px 0 0 0", color: "#4a5568", fontSize: "0.9rem" }}>{t.description?.substring(0, 100)}...</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

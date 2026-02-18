
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import API from "../../../api";
import { MessageSquare, Send, CheckCircle, AlertCircle } from "lucide-react";
import "./town.css";

export default function ComplaintsPage() {
  const { townSlug } = useParams();
  const [fromName, setFromName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [message, setMessage] = useState("");
  const [msg, setMsg] = useState("");

  const submit = async () => {
    setMsg("");
    try {
      if (!message.trim()) {
        setMsg("Please type your complaint.");
        return;
      }
      await API.post(`/visitor/${townSlug}/complaints`, { fromName, fromEmail, message });
      setFromName(""); setFromEmail(""); setMessage("");
      setMsg("✅ Complaint submitted to admin.");
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to submit complaint");
    }
  };

  return (
    <div className="tl-page">
      <div className="tl-container" style={{ maxWidth: 600, margin: "0 auto" }}>
        <div className="tl-header" style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 className="tl-title">Submit a <span style={{ color: "var(--th-primary)" }}>Complaint</span></h1>
          <p className="tl-subtitle">Found an issue? Let the town administration know.</p>
        </div>

        <div className="tl-card" style={{ padding: 30, background: "white" }}>
          {msg && (
            <div className="tl-error" style={{ marginBottom: 20, background: msg.includes("✅") ? "#dcfce7" : "#fee2e2", color: msg.includes("✅") ? "#166534" : "#991b1b", borderColor: "transparent" }}>
              {msg}
            </div>
          )}

          <div style={{ display: "grid", gap: 16 }}>
            <div className="tl-form-group">
              <label className="tl-label">Name (Optional)</label>
              <input className="input" placeholder="Your name" value={fromName} onChange={(e) => setFromName(e.target.value)} style={{ width: "100%" }} />
            </div>
            <div className="tl-form-group">
              <label className="tl-label">Email / Contact (Optional)</label>
              <input className="input" placeholder="How can we reach you?" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} style={{ width: "100%" }} />
            </div>
            <div className="tl-form-group">
              <label className="tl-label">Complaint / Issue *</label>
              <textarea className="input" placeholder="Describe the issue..." value={message} onChange={(e) => setMessage(e.target.value)} style={{ width: "100%", height: 120, paddingTop: 10 }} />
            </div>

            <button className="pd-contact-btn primary" onClick={submit} style={{ marginTop: 10, justifyContent: "center" }}>
              Submit Complaint
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

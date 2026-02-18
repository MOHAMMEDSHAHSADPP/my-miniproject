import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import API from "../../api";
import "./RServices.css";

export default function ResidentDirectory() {
  const { townSlug } = useOutletContext();
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    API.get(`/resident/directory?town=${townSlug}`)
      .then(r => setContacts(r.data || []))
      .catch(e => console.error(e));
  }, [townSlug]);

  return (
    <div className="rservices-container">
      <h2>📞 Important Contacts & Directory</h2>
      <div className="rservices-list" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))" }}>
        {contacts.length === 0 ? <p className="empty-msg">No contacts listed.</p> : (
          contacts.map((c) => (
            <div key={c._id} className="rservices-card" style={{ textAlign: "center" }}>
              <h4>{c.name}</h4>
              <p style={{ color: "#2a214f", fontWeight: "bold", margin: "8px 0" }}>{c.phone}</p>
              <p style={{ fontSize: "0.9rem", color: "#718096" }}>{c.designation || c.category}</p>
              <a href={`tel:${c.phone}`} style={{ display: "inline-block", marginTop: 10, padding: "6px 12px", background: "#edf2f7", borderRadius: 20, textDecoration: "none", color: "#2d3748", fontSize: "0.85rem" }}>
                📞 Call Now
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
